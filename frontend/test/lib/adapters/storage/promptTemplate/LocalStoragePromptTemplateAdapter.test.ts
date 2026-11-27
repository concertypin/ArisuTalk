import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LocalStoragePromptTemplateAdapter } from "@/lib/adapters/storage/promptTemplate/LocalStoragePromptTemplateAdapter";
import type { PromptTemplate } from "@/lib/types/promptTemplate";
import { Logger } from "@common/logger/Logger";
import { createLocalStorageMock } from "@test/utils/localStorageMock";

const STORAGE_KEY = "arisutalk_prompt_templates";

/** Builds a valid template, letting a test override only the fields it cares about. */
function makeTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
    return {
        id: "tpl-1",
        name: "Roleplay",
        description: "A template",
        prompts: { system: "sys", generation: "gen", lore: "lore" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("LocalStoragePromptTemplateAdapter", () => {
    let adapter: LocalStoragePromptTemplateAdapter;
    let storage: Storage;

    beforeEach(() => {
        storage = createLocalStorageMock(vi);
        vi.stubGlobal("localStorage", storage);
        adapter = new LocalStoragePromptTemplateAdapter();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe("init", () => {
        it("does not warn in development builds", async () => {
            vi.stubEnv("DEV", true);
            const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});

            await adapter.init();

            expect(warn).not.toHaveBeenCalled();
        });

        it("warns outside development builds that this adapter is for development only", async () => {
            vi.stubEnv("DEV", false);
            const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});

            await adapter.init();

            expect(warn).toHaveBeenCalledWith(expect.stringContaining("development/testing only"));
        });
    });

    describe("getAll", () => {
        it("returns an empty list when nothing is stored", async () => {
            expect(await adapter.getAll()).toEqual([]);
        });

        it("returns the stored templates", async () => {
            const template = makeTemplate();
            storage.setItem(STORAGE_KEY, JSON.stringify([template]));

            expect(await adapter.getAll()).toEqual([template]);
        });

        it("returns an empty list when the stored value is not valid JSON", async () => {
            storage.setItem(STORAGE_KEY, "{not json");

            expect(await adapter.getAll()).toEqual([]);
        });

        it("returns an empty list when the stored JSON is not an array", async () => {
            storage.setItem(STORAGE_KEY, JSON.stringify({ id: "tpl-1", name: "x" }));

            expect(await adapter.getAll()).toEqual([]);
        });

        it("drops entries that lack a string id or name but keeps valid ones", async () => {
            const valid = makeTemplate({ id: "valid" });
            storage.setItem(
                STORAGE_KEY,
                JSON.stringify([
                    null,
                    "text",
                    42,
                    { name: "no id" },
                    { id: "no name" },
                    { id: 1, name: "numeric id" },
                    { id: "numeric name", name: 2 },
                    valid,
                ])
            );

            expect(await adapter.getAll()).toEqual([valid]);
        });
    });

    describe("get", () => {
        it("returns the template with the matching id", async () => {
            const first = makeTemplate({ id: "a", name: "First" });
            const second = makeTemplate({ id: "b", name: "Second" });
            storage.setItem(STORAGE_KEY, JSON.stringify([first, second]));

            expect(await adapter.get("b")).toEqual(second);
        });

        it("returns undefined for an unknown id", async () => {
            await adapter.save(makeTemplate({ id: "a" }));

            expect(await adapter.get("missing")).toBeUndefined();
        });
    });

    describe("save", () => {
        it("appends a template with a new id", async () => {
            await adapter.save(makeTemplate({ id: "a" }));
            await adapter.save(makeTemplate({ id: "b" }));

            const ids = (await adapter.getAll()).map((t) => t.id);
            expect(ids).toEqual(["a", "b"]);
        });

        it("overwrites the template with the same id in place instead of duplicating it", async () => {
            await adapter.save(makeTemplate({ id: "a", name: "Old" }));
            await adapter.save(makeTemplate({ id: "b", name: "Other" }));

            await adapter.save(makeTemplate({ id: "a", name: "New" }));

            const all = await adapter.getAll();
            expect(all.map((t) => [t.id, t.name])).toEqual([
                ["a", "New"],
                ["b", "Other"],
            ]);
        });

        it("persists to localStorage as JSON under the templates key", async () => {
            const template = makeTemplate();

            await adapter.save(template);

            expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "null")).toEqual([template]);
        });
    });

    describe("delete", () => {
        it("removes only the template with the given id", async () => {
            await adapter.save(makeTemplate({ id: "a" }));
            await adapter.save(makeTemplate({ id: "b" }));

            await adapter.delete("a");

            expect((await adapter.getAll()).map((t) => t.id)).toEqual(["b"]);
        });

        it("leaves an empty array in storage after deleting the last template", async () => {
            await adapter.save(makeTemplate({ id: "a" }));

            await adapter.delete("a");

            expect(storage.getItem(STORAGE_KEY)).toBe("[]");
        });

        it("is a no-op for an unknown id", async () => {
            await adapter.save(makeTemplate({ id: "a" }));

            await adapter.delete("missing");

            expect((await adapter.getAll()).map((t) => t.id)).toEqual(["a"]);
        });
    });
});
