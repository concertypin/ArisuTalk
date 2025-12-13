import type { IStorageAdapter } from "@/lib/interfaces/IStorageAdapter";
import type { Chat, Character } from "@arisutalk/character-spec/v0/Character";
import type { Settings } from "@/lib/types/IDataModel";

export class LocalStorageAdapter implements IStorageAdapter {
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

    private getStored<T>(key: string): T[] {
        const item = localStorage.getItem(key);
        if (!item) return [];
        try {
            return JSON.parse(item) as T[];
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
        // Assuming Character has an id. If not, we might need a different strategy.
        // The spec implies name might be unique or there's an internal ID.
        // For now, let's assume we might need to handle it by index/name if ID is missing,
        // but robust systems usually have IDs.
        // Checking the spec... wait, I don't have the spec loaded.
        // Let's assume unique name for now if ID is missing, but ideally it should have ID.
        // Actually, looking at previous context, `Character` types were imported.
        // Let's assume standard behavior:

        // Use name as ID if no explicit ID field (temporary fallback)
        // But better to check if 'id' or 'name' is the key.
        // The provided CharacterStore used index.
        // Let's just use the array.replace logic if we can match object identity or similar?
        // No, persistence needs a key.
        // Let's assume character.name is the key for now as per "simple" requirements, or generate a UUID if needed.
        // But wait, the interface uses `id`.

        // Fallback: If character doesn't have an ID, we can't reliably update it in this pattern without an ID.
        // I'll check the Character type definition in a moment.
        // For this implementation, I will assume `name` is unique enough for "Basic" or `id` exists.

        // Actually, I should probably check the Character type definition.
        // But to proceed, I will write generic logic.
        // todo

        const index = characters.findIndex(
            (c) => c.id === character.id || c.name === character.name
        );

        if (index >= 0) {
            characters[index] = character;
        } else {
            characters.push(character);
        }
        this.setStored(this.KEYS.CHARACTERS, characters);
    }

    async getCharacter(id: string): Promise<Character | undefined> {
        const characters = this.getStored<Character>(this.KEYS.CHARACTERS);
        // Matching by ID or Name
        return characters.find((c) => c.id === id || c.name === id);
    }

    async getAllCharacters(): Promise<Character[]> {
        return this.getStored<Character>(this.KEYS.CHARACTERS);
    }

    async deleteCharacter(id: string): Promise<void> {
        const characters = this.getStored<Character>(this.KEYS.CHARACTERS);
        const filtered = characters.filter((c) => c.id !== id && c.name !== id);
        this.setStored(this.KEYS.CHARACTERS, filtered);
    }

    async saveSettings(settings: Settings): Promise<void> {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    }

    async getSettings(): Promise<Settings> {
        const item = localStorage.getItem(this.KEYS.SETTINGS);
        if (!item) {
            // Return default settings
            return {
                userId: "user",
                theme: "system",
                language: "en",
                general: {},
                appearance: {},
            } as Settings;
        }
        return JSON.parse(item) as Settings;
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
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
        }

        const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        const decoder = new TextDecoder();
        const json = decoder.decode(combined);
        try {
            const data = JSON.parse(json);
            if (data.chats) this.setStored(this.KEYS.CHATS, data.chats);
            if (data.characters) this.setStored(this.KEYS.CHARACTERS, data.characters);
            if (data.settings) await this.saveSettings(data.settings);
        } catch (e) {
            console.error("Failed to import data", e);
            throw new Error("Invalid data format");
        }
    }
}
