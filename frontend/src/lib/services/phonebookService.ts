import type {
    PhonebookImportResult,
    ImportedCharacterData,
} from "../stores/character";
import type { ClerkInstance } from "../stores/auth";
import {
    extractPngChunk,
    decompressData,
    uint8ArrayToDataUrl,
} from "../utils/png-utils.js";

const PHONEBOOK_BASE_URL = import.meta.env.VITE_PHONEBOOK_BASE_URL;
const PHONEBOOK_CHECK_URL = `${PHONEBOOK_BASE_URL}/`;
export interface PhonebookEntrySummary {
    id: string;
    name: string;
    description?: string;
    author?: string;
    additionalData?: string;
    downloadCount?: number;
    uploadedAt?: number;
    encrypted?: boolean;
}

interface PhonebookEntryDetail extends PhonebookEntrySummary {
    additionalData: string;
}

interface PhonebookFetchContext {
    clerk: ClerkInstance;
    token: string;
}

const JSON_MIME_PATTERN = /application\/(json|ld\+json)/i;
const IMAGE_MIME_PATTERN = /^image\//i;

/**
 * Acquire an authorization context for the current user.
 */
async function createFetchContext(
    clerk: ClerkInstance
): Promise<PhonebookFetchContext> {
    const session = clerk.session;
    if (!session) {
        throw new Error("No active Clerk session");
    }

    const token = await session.getToken();
    if (!token) {
        throw new Error("Failed to obtain authentication token");
    }

    return { clerk, token };
}

function authHeaders(token: string): HeadersInit {
    return {
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Check whether the authenticated user can access the phonebook service.
 */
export async function verifyPhonebookAccess(
    clerk: ClerkInstance
): Promise<boolean> {
    const { token } = await createFetchContext(clerk);
    const response = await fetch(PHONEBOOK_CHECK_URL, {
        method: "GET",
        headers: authHeaders(token),
        credentials: "include",
    });

    if (!response.ok) {
        console.error(
            "Phonebook access check failed",
            response.status,
            response.statusText
        );
        return false;
    }

    return true;
}

function normalizeEntry(raw: unknown): PhonebookEntrySummary | null {
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const candidate = raw as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : undefined;
    const name =
        typeof candidate.name === "string" ? candidate.name : undefined;

    if (!id || !name) {
        return null;
    }

    const summary: PhonebookEntrySummary = {
        id,
        name,
    };

    if (typeof candidate.description === "string") {
        summary.description = candidate.description;
    }
    if (typeof candidate.author === "string") {
        summary.author = candidate.author;
    }
    if (typeof candidate.additionalData === "string") {
        summary.additionalData = candidate.additionalData;
    }
    if (typeof candidate.downloadCount === "number") {
        summary.downloadCount = candidate.downloadCount;
    }
    if (typeof candidate.uploadedAt === "number") {
        summary.uploadedAt = candidate.uploadedAt;
    }
    if (typeof candidate.encrypted === "boolean") {
        summary.encrypted = candidate.encrypted;
    }

    return summary;
}

/**
 * Retrieve phonebook entry summaries for the authenticated user.
 */
export async function listPhonebookEntries(
    clerk: ClerkInstance
): Promise<PhonebookEntrySummary[]> {
    const { token } = await createFetchContext(clerk);
    const response = await fetch(`${PHONEBOOK_BASE_URL}/api/data`, {
        method: "GET",
        headers: authHeaders(token),
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch phonebook entries: ${response.status} ${response.statusText}`
        );
    }

    const payload: unknown = await response.json().catch(() => []);

    const items = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : [];

    const normalized = items
        .map((item) => normalizeEntry(item))
        .filter((item): item is PhonebookEntrySummary => Boolean(item));

    return normalized;
}

async function getEntryDetail(
    clerk: ClerkInstance,
    id: string
): Promise<PhonebookEntryDetail> {
    const { token } = await createFetchContext(clerk);
    const response = await fetch(
        `${PHONEBOOK_BASE_URL}/api/data/${encodeURIComponent(id)}`,
        {
            method: "GET",
            headers: authHeaders(token),
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch phonebook entry: ${response.status}`);
    }

    const data = normalizeEntry(await response.json());
    if (!data || !data.additionalData) {
        throw new Error("Phonebook entry is missing download information");
    }

    return data as PhonebookEntryDetail;
}

function parseJsonCharacter(payload: unknown): ImportedCharacterData {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid phonebook character payload");
    }

    const source = payload as Record<string, unknown>;
    const name = typeof source.name === "string" ? source.name : "";
    const prompt = typeof source.prompt === "string" ? source.prompt : "";

    if (!name || !prompt) {
        throw new Error(
            "Phonebook character payload is missing mandatory fields"
        );
    }

    const character: ImportedCharacterData = {
        name,
        prompt,
    };

    if (typeof source.avatar === "string") {
        character.avatar = source.avatar;
    }
    if (typeof source.appearance === "string") {
        character.appearance = source.appearance;
    }
    if (typeof source.proactiveEnabled === "boolean") {
        character.proactiveEnabled = source.proactiveEnabled;
    }
    if (typeof source.responseTime === "number") {
        character.responseTime = source.responseTime;
    }
    if (typeof source.thinkingTime === "number") {
        character.thinkingTime = source.thinkingTime;
    }
    if (typeof source.reactivity === "number") {
        character.reactivity = source.reactivity;
    }
    if (typeof source.tone === "number") {
        character.tone = source.tone;
    }
    if (Array.isArray(source.memories)) {
        character.memories = source.memories;
    }
    if (Array.isArray(source.stickers)) {
        character.stickers = source.stickers;
    }
    if (source.naiSettings && typeof source.naiSettings === "object") {
        character.naiSettings = source.naiSettings as Record<string, unknown>;
    }
    if (source.hypnosis && typeof source.hypnosis === "object") {
        character.hypnosis = source.hypnosis as Record<string, unknown>;
    }

    return character;
}

async function parsePngCharacter(
    bytes: Uint8Array,
    mimeType: string
): Promise<ImportedCharacterData> {
    const cChrChunk = extractPngChunk(bytes, "cChr");
    const chArChunk = cChrChunk ?? extractPngChunk(bytes, "chAr");
    if (!chArChunk) {
        throw new Error("PNG card does not contain character data");
    }

    let decodedBytes = chArChunk;
    try {
        decodedBytes = await decompressData(chArChunk);
    } catch (error) {
        console.warn("Failed to decompress PNG chunk", error);
    }

    const jsonString = new TextDecoder().decode(decodedBytes);
    const payload = JSON.parse(jsonString) as Record<string, unknown>;
    const character = parseJsonCharacter(payload);
    character.avatar = uint8ArrayToDataUrl(bytes, mimeType);
    return character;
}

async function downloadCharacterData(
    ctx: PhonebookFetchContext,
    entry: PhonebookEntryDetail
): Promise<ImportedCharacterData> {
    if (entry.encrypted) {
        throw new Error(
            "This character is encrypted and cannot be imported. Please contact the character creator for an unencrypted version."
        );
    }

    const downloadUrl = new URL(
        entry.additionalData,
        PHONEBOOK_BASE_URL
    ).toString();

    const response = await fetch(downloadUrl, {
        method: "GET",
        headers: authHeaders(ctx.token),
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(
            `Failed to download phonebook card: ${response.status}`
        );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (JSON_MIME_PATTERN.test(contentType)) {
        const payload = await response.json();
        return parseJsonCharacter(payload);
    }

    if (IMAGE_MIME_PATTERN.test(contentType)) {
        const buffer = await response.arrayBuffer();
        return parsePngCharacter(
            new Uint8Array(buffer),
            contentType.split(";")[0]
        );
    }

    const fallbackText = await response.text();
    try {
        const payload = JSON.parse(fallbackText);
        return parseJsonCharacter(payload);
    } catch (error) {
        throw new Error(`Unsupported phonebook card format: ${contentType}`);
    }
}

/**
 * Download a character entry from the phonebook.
 */
export async function importPhonebookCharacter(
    clerk: ClerkInstance,
    entryId: string
): Promise<PhonebookImportResult> {
    const ctx = await createFetchContext(clerk);
    const entry = await getEntryDetail(ctx.clerk, entryId);
    const character = await downloadCharacterData(ctx, entry);
    return {
        character,
        sourceId: entry.id,
    };
}
