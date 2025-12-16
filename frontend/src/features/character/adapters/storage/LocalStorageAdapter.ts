import type { Chat, Character } from "@arisutalk/character-spec/v0/Character";
import { Settings, SettingsSchema } from "@/lib/types/IDataModel";

export class LocalStorageAdapter {
    private readonly KEYS = {
        CHATS: "arisutalk_chats",
        CHARACTERS: "arisutalk_characters",
        SETTINGS: "arisutalk_settings",
    };

    async init(): Promise<void> {
        if (!import.meta.env.DEV)
            console.warn("LocalStorageAdapter is intended for development/testing purposes only.");
        // LocalStorage is synchronous and always ready in browser environment
        return Promise.resolve();
    }

    private hasId(value: unknown): value is { id: string } {
        return this.isRecord(value) && typeof value.id === "string";
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    private getStored<T extends { id: string }>(key: string): T[] {
        const item = localStorage.getItem(key);
        if (!item) return [];
        try {
            const parsed = JSON.parse(item) as unknown;
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((entry): entry is T => this.hasId(entry));
        } catch {
            return [];
        }
    }

    private setStored<T>(key: string, data: T[]): void {
        localStorage.setItem(key, JSON.stringify(data));
    }

    async saveChat(chat: Chat): Promise<void> {
        const chats = this.getStored<Chat>(this.KEYS.CHATS);
        const index = chats.findIndex((c) => c.id === chat.id);
        if (index >= 0) {
            chats[index] = chat;
        } else {
            chats.push(chat);
        }
        this.setStored(this.KEYS.CHATS, chats);
    }

    async getChat(id: string): Promise<Chat | undefined> {
        const chats = this.getStored<Chat>(this.KEYS.CHATS);
        return chats.find((c) => c.id === id);
    }

    async getAllChats(): Promise<Chat[]> {
        return this.getStored<Chat>(this.KEYS.CHATS);
    }

    async deleteChat(id: string): Promise<void> {
        const chats = this.getStored<Chat>(this.KEYS.CHATS);
        const filtered = chats.filter((c) => c.id !== id);
        this.setStored(this.KEYS.CHATS, filtered);
    }

    async saveCharacter(character: Character): Promise<void> {
        const characters = this.getStored<Character>(this.KEYS.CHARACTERS);
        const index = characters.findIndex((c) => c.id === character.id);

        if (index >= 0) {
            characters[index] = character;
        } else {
            characters.push(character);
        }
        this.setStored(this.KEYS.CHARACTERS, characters);
    }

    async getCharacter(id: string): Promise<Character | undefined> {
        const characters = this.getStored<Character>(this.KEYS.CHARACTERS);
        // Matching by ID
        return characters.find((c) => c.id === id);
    }

    async getAllCharacters(): Promise<Character[]> {
        return this.getStored<Character>(this.KEYS.CHARACTERS);
    }

    async deleteCharacter(id: string): Promise<void> {
        const characters = this.getStored<Character>(this.KEYS.CHARACTERS);
        const filtered = characters.filter((c) => c.id !== id);
        this.setStored(this.KEYS.CHARACTERS, filtered);
    }

    async saveSettings(settings: Settings): Promise<void> {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    }

    async getSettings(): Promise<Settings> {
        const item = localStorage.getItem(this.KEYS.SETTINGS);
        if (!item) {
            // Return default settings using the Settings class (ensures userId uses crypto.randomUUID())
            return SettingsSchema.parse({});
        }
        const parsed: unknown = JSON.parse(item);
        return SettingsSchema.parse(parsed);
    }

    async exportData(): Promise<ReadableStream<Uint8Array>> {
        const data = {
            chats: this.getStored(this.KEYS.CHATS),
            characters: this.getStored(this.KEYS.CHARACTERS),
            settings: await this.getSettings(),
        };
        const json = JSON.stringify(data);
        const encoder = new TextEncoder();
        const uint8 = encoder.encode(json);

        return new ReadableStream({
            start(controller) {
                controller.enqueue(uint8);
                controller.close();
            },
        });
    }

    async importData(stream: ReadableStream<Uint8Array>): Promise<void> {
        try {
            const buffer = await new Response(stream).arrayBuffer();
            const json = new TextDecoder().decode(buffer);
            const parsed = JSON.parse(json) as unknown;
            if (!this.isRecord(parsed)) {
                throw new Error("Invalid data format");
            }

            const maybeChats = parsed.chats;
            if (Array.isArray(maybeChats)) {
                const chats = maybeChats.filter((c): c is Chat => this.hasId(c));
                this.setStored(this.KEYS.CHATS, chats);
            }

            const maybeCharacters = parsed.characters;
            if (Array.isArray(maybeCharacters)) {
                const characters = maybeCharacters.filter((c): c is Character => this.hasId(c));
                this.setStored(this.KEYS.CHARACTERS, characters);
            }

            const maybeSettings = parsed.settings;
            if (maybeSettings !== undefined) {
                const result = SettingsSchema.safeParse(maybeSettings);
                if (result.success) await this.saveSettings(result.data);
            }
        } catch (e) {
            console.error("Failed to import data", e);
            throw new Error("Invalid data format");
        }
    }
}
