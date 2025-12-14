import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";

describe("IndexedDBHelper (ArisuDB)", () => {
    const db = getArisuDB();

    beforeEach(async () => {
        await db.chats.clear();
        await db.characters.clear();
        await db.settings.clear();
        await db.personas.clear();
        await db.messages.clear();
    });

    describe("Database structure", () => {
        it("has all required tables", () => {
            expect(db.chats).toBeDefined();
            expect(db.characters).toBeDefined();
            expect(db.settings).toBeDefined();
            expect(db.personas).toBeDefined();
            expect(db.messages).toBeDefined();
        });

        it("opens successfully", async () => {
            await expect(db.open()).resolves.not.toThrow();
        });
    });

    describe("Characters table", () => {
        const testCharacter = {
            id: "char-1",
            name: "Test Character",
            specVersion: 0 as const,
            description: "A test character",
            assets: { assets: [] },
            prompt: {
                description: "",
                authorsNote: "",
                lorebook: { config: { tokenLimit: 0 }, data: [] },
            },
            executables: {
                runtimeSetting: { mem: undefined },
                replaceHooks: { display: [], input: [], output: [], request: [] },
            },
            metadata: {
                author: undefined,
                license: "",
                version: undefined,
                distributedOn: undefined,
                additionalInfo: undefined,
            },
        };

        it("puts and gets a character", async () => {
            await db.characters.put(testCharacter);
            const result = await db.characters.get("char-1");
            expect(result?.name).toBe("Test Character");
        });

        it("returns undefined for non-existent character", async () => {
            const result = await db.characters.get("non-existent");
            expect(result).toBeUndefined();
        });

        it("deletes a character", async () => {
            await db.characters.put(testCharacter);
            await db.characters.delete("char-1");
            const result = await db.characters.get("char-1");
            expect(result).toBeUndefined();
        });

        it("lists all characters", async () => {
            await db.characters.put(testCharacter);
            await db.characters.put({ ...testCharacter, id: "char-2", name: "Second" });
            const all = await db.characters.toArray();
            expect(all.length).toBe(2);
        });

        it("clears all characters", async () => {
            await db.characters.put(testCharacter);
            await db.characters.clear();
            const all = await db.characters.toArray();
            expect(all.length).toBe(0);
        });
    });

    describe("Chats table with indexes", () => {
        const testChat = {
            id: "chat-1",
            characterId: "char-1",
            title: "Test Chat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        it("queries by characterId index", async () => {
            await db.chats.put(testChat);
            await db.chats.put({ ...testChat, id: "chat-2", characterId: "char-2" });
            const results = await db.chats.where("characterId").equals("char-1").toArray();
            expect(results.length).toBe(1);
            expect(results[0].id).toBe("chat-1");
        });

        it("orders by createdAt", async () => {
            const now = Date.now();
            await db.chats.put({ ...testChat, id: "chat-old", createdAt: now - 1000 });
            await db.chats.put({ ...testChat, id: "chat-new", createdAt: now });
            const results = await db.chats.orderBy("createdAt").toArray();
            expect(results[0].id).toBe("chat-old");
            expect(results[1].id).toBe("chat-new");
        });
    });

    describe("Messages table with indexes", () => {
        const testMessage = {
            id: "msg-1",
            chatId: "chat-1",
            role: "user" as const,
            content: { type: "string" as const, data: "Hello" },
            timestamp: Date.now(),
            inlays: [],
        };

        it("queries by chatId index", async () => {
            await db.messages.put(testMessage);
            await db.messages.put({ ...testMessage, id: "msg-2", chatId: "chat-2" });
            const results = await db.messages.where("chatId").equals("chat-1").toArray();
            expect(results.length).toBe(1);
        });

        it("queries by role", async () => {
            await db.messages.put(testMessage);
            await db.messages.put({ ...testMessage, id: "msg-2", role: "assistant" });
            const users = await db.messages.where("role").equals("user").toArray();
            expect(users.length).toBe(1);
        });

        it("handles bulk put", async () => {
            const messages = [
                { ...testMessage, id: "msg-1" },
                { ...testMessage, id: "msg-2" },
                { ...testMessage, id: "msg-3" },
            ];
            await db.messages.bulkPut(messages);
            const all = await db.messages.toArray();
            expect(all.length).toBe(3);
        });
    });

    describe("Personas table", () => {
        const testPersona = {
            id: "persona-1",
            name: "Test Persona",
            description: "A test persona",
            assets: { assets: [] },
        };

        it("puts and gets a persona", async () => {
            await db.personas.put(testPersona);
            const result = await db.personas.get("persona-1");
            expect(result?.name).toBe("Test Persona");
        });

        it("queries by name index", async () => {
            await db.personas.put(testPersona);
            await db.personas.put({ ...testPersona, id: "persona-2", name: "Another" });
            const results = await db.personas.where("name").equals("Test Persona").toArray();
            expect(results.length).toBe(1);
        });
    });

    describe("Settings table", () => {
        const testSettings = {
            id: "singleton",
            theme: "dark" as const,
            userId: "user-123",
            activePersonaId: null,
        };

        it("stores singleton settings", async () => {
            await db.settings.put(testSettings);
            const result = await db.settings.get("singleton");
            expect(result?.theme).toBe("dark");
        });

        it("updates existing settings", async () => {
            await db.settings.put(testSettings);
            await db.settings.put({ ...testSettings, theme: "light" });
            const result = await db.settings.get("singleton");
            expect(result?.theme).toBe("light");
        });
    });

    describe("deleteAll", () => {
        it("clears all tables", async () => {
            await db.characters.put({
                id: "c1",
                name: "X",
                specVersion: 0,
                description: "",
                assets: { assets: [] },
                prompt: {
                    description: "",
                    authorsNote: "",
                    lorebook: { config: { tokenLimit: 0 }, data: [] },
                },
                executables: {
                    runtimeSetting: { mem: undefined },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                metadata: {
                    author: undefined,
                    license: "",
                    version: undefined,
                    distributedOn: undefined,
                    additionalInfo: undefined,
                },
            });
            await db.chats.put({
                id: "ch1",
                characterId: "c1",
                title: "",
                createdAt: 0,
                updatedAt: 0,
            });
            await db.deleteAll();
            expect((await db.characters.toArray()).length).toBe(0);
            expect((await db.chats.toArray()).length).toBe(0);
        });
    });
});
