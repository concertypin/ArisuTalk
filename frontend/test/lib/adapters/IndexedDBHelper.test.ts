import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { CharacterSchema, type Character } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";

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

    describe("deleteAll", () => {
        it("clears all tables", async () => {
            await db.characters.put(
                apply(CharacterSchema, {
                    id: "c1",
                    name: "X",
                    specVersion: 0,
                    description: "Y",
                    assets: {
                        assets: [],
                    },
                    prompt: {
                        description: "",
                    },
                    metadata: {},
                })
            );
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
