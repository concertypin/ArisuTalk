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
            // Return default settings
            return {
                userId: "user",
                theme: "system",
            };
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
        try {
            const buffer = await new Response(stream).arrayBuffer();
            const json = new TextDecoder().decode(buffer);
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
