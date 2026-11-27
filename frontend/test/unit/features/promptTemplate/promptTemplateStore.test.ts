import { describe, it, expect, beforeEach, vi, onTestFinished } from "vitest";
import { PromptTemplateStore } from "@/features/promptTemplate/stores/promptTemplateStore.svelte";
import type { PromptTemplate, IPromptTemplateStorageAdapter } from "@/features/promptTemplate";
import { Logger } from "@common/logger/Logger";
import { createLocalStorageMock } from "@test/utils/localStorageMock";

const STORAGE_KEY = "arisutalk_prompt_templates";

/** In-memory adapter whose methods are spies, so tests can assert on and break individual calls. */
class MemoryAdapter implements IPromptTemplateStorageAdapter {
    items: PromptTemplate[] = [];
    init = vi.fn(async () => {});
    getAll = vi.fn(async () => this.items.map((t) => ({ ...t })));
    get = vi.fn(async (id: string) => this.items.find((t) => t.id === id));
    save = vi.fn(async (template: PromptTemplate) => {
        const index = this.items.findIndex((t) => t.id === template.id);
        if (index >= 0) this.items[index] = template;
        else this.items.push(template);
    });
    delete = vi.fn(async (id: string) => {
        this.items = this.items.filter((t) => t.id !== id);
    });
}

function makeTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
    return {
        id: "tpl-1",
        name: "Existing",
        description: "desc",
        prompts: { system: "sys", generation: "gen" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("PromptTemplateStore", () => {
    let storage: Storage;
    let adapter: MemoryAdapter;

    beforeEach(() => {
        storage = createLocalStorageMock(vi);
        vi.stubGlobal("localStorage", storage);
        adapter = new MemoryAdapter();
        vi.spyOn(Logger, "error").mockImplementation(() => {});
        vi.spyOn(Logger, "warn").mockImplementation(() => {});
        vi.spyOn(Logger, "info").mockImplementation(() => {});
        onTestFinished(() => {
            vi.unstubAllGlobals();
            vi.restoreAllMocks();
        });
    });

    describe("initialization", () => {
        it("initializes the adapter and loads existing templates", async () => {
            adapter.items = [makeTemplate({ id: "a" }), makeTemplate({ id: "b" })];
            storage.setItem(STORAGE_KEY, "[]");

            const store = new PromptTemplateStore(adapter);
            await store.initPromise;

            expect(adapter.init).toHaveBeenCalledOnce();
            expect(store.templates.map((t) => t.id)).toEqual(["a", "b"]);
            expect(store.loaded).toBe(true);
        });

        it("seeds the default templates on the first visit, when the storage key does not exist", async () => {
            const store = new PromptTemplateStore(adapter);
            await store.initPromise;

            expect(store.templates.map((t) => t.name)).toEqual([
                "Character Roleplay",
                "Creative Writing Helper",
                "Language Tutor",
            ]);
            expect(adapter.items).toHaveLength(3);
            expect(store.loaded).toBe(true);
        });

        it("gives every seeded template a unique id and matching timestamps", async () => {
            const store = new PromptTemplateStore(adapter);
            await store.initPromise;

            const ids = new Set(store.templates.map((t) => t.id));
            expect(ids.size).toBe(3);
            for (const template of store.templates) {
                expect(template.id).not.toBe("");
                expect(template.createdAt).toBe(template.updatedAt);
                expect(Number.isNaN(Date.parse(template.createdAt))).toBe(false);
            }
        });

        it("does not seed again when the user has emptied the list (key exists as [])", async () => {
            storage.setItem(STORAGE_KEY, "[]");

            const store = new PromptTemplateStore(adapter);
            await store.initPromise;

            expect(store.templates).toEqual([]);
            expect(adapter.save).not.toHaveBeenCalled();
        });

        it("does not seed when the adapter already holds templates but the key is missing", async () => {
            adapter.items = [makeTemplate({ id: "kept" })];

            const store = new PromptTemplateStore(adapter);
            await store.initPromise;

            expect(store.templates.map((t) => t.id)).toEqual(["kept"]);
            expect(adapter.save).not.toHaveBeenCalled();
        });

        it("falls back to an empty list and still marks the store loaded when loading fails", async () => {
            adapter.getAll.mockRejectedValue(new Error("storage unavailable"));

            const store = new PromptTemplateStore(adapter);
            await store.initPromise;

            expect(store.templates).toEqual([]);
            expect(store.loaded).toBe(true);
            expect(Logger.error).toHaveBeenCalledWith(
                expect.stringContaining("failed to load templates"),
                expect.any(Error)
            );
        });

        it("logs and does not reject initPromise when the adapter cannot initialize", async () => {
            adapter.init.mockRejectedValue(new Error("init failed"));

            const store = new PromptTemplateStore(adapter);

            await expect(store.initPromise).resolves.toBeUndefined();
            expect(Logger.error).toHaveBeenCalledWith(
                expect.stringContaining("initialization failed"),
                expect.any(Error)
            );
            expect(store.loaded).toBe(false);
        });
    });

    describe("create", () => {
        let store: PromptTemplateStore;

        beforeEach(async () => {
            storage.setItem(STORAGE_KEY, "[]");
            store = new PromptTemplateStore(adapter);
            await store.initPromise;
        });

        it("persists a new template and adds it to the state", async () => {
            const created = await store.create({
                name: "Mine",
                description: "My description",
                prompts: { system: "s", generation: "g" },
            });

            expect(created.name).toBe("Mine");
            expect(created.id).not.toBe("");
            expect(created.createdAt).toBe(created.updatedAt);
            expect(adapter.save).toHaveBeenCalledWith(created);
            expect(store.templates).toEqual([created]);
        });

        it("gives each created template a distinct id", async () => {
            const input = { name: "T", description: "", prompts: { system: "", generation: "" } };

            const first = await store.create(input);
            const second = await store.create(input);

            expect(first.id).not.toBe(second.id);
            expect(store.templates).toHaveLength(2);
        });

        it("does not add the template to the state when persisting fails", async () => {
            adapter.save.mockRejectedValue(new Error("quota exceeded"));

            await expect(
                store.create({
                    name: "T",
                    description: "",
                    prompts: { system: "", generation: "" },
                })
            ).rejects.toThrow("quota exceeded");
            expect(store.templates).toEqual([]);
        });

        it("falls back to a timestamp-based id when crypto.randomUUID is unavailable", async () => {
            vi.stubGlobal("crypto", {});

            const created = await store.create({
                name: "T",
                description: "",
                prompts: { system: "", generation: "" },
            });

            expect(created.id).toMatch(/^\d+-[a-z0-9]+$/);
        });
    });

    describe("update", () => {
        let store: PromptTemplateStore;

        beforeEach(async () => {
            adapter.items = [
                makeTemplate({ id: "a", name: "First" }),
                makeTemplate({ id: "b", name: "Second" }),
            ];
            storage.setItem(STORAGE_KEY, "[]");
            store = new PromptTemplateStore(adapter);
            await store.initPromise;
        });

        it("merges the given fields, keeps the rest and refreshes updatedAt", async () => {
            await store.update("a", { name: "Renamed" });

            const updated = store.templates.find((t) => t.id === "a");
            expect(updated?.name).toBe("Renamed");
            expect(updated?.description).toBe("desc");
            expect(updated?.createdAt).toBe("2026-01-01T00:00:00.000Z");
            expect(updated?.updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
            expect(adapter.items.find((t) => t.id === "a")?.name).toBe("Renamed");
        });

        it("leaves other templates untouched", async () => {
            await store.update("a", { name: "Renamed" });

            expect(store.templates.find((t) => t.id === "b")?.name).toBe("Second");
        });

        it("warns and changes nothing when the id does not exist", async () => {
            await store.update("missing", { name: "Ghost" });

            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
            expect(adapter.save).not.toHaveBeenCalled();
            expect(store.templates.map((t) => t.name)).toEqual(["First", "Second"]);
        });

        it("keeps the old state when persisting fails", async () => {
            adapter.save.mockRejectedValue(new Error("write failed"));

            await expect(store.update("a", { name: "Renamed" })).rejects.toThrow("write failed");
            expect(store.templates.find((t) => t.id === "a")?.name).toBe("First");
        });
    });

    describe("delete", () => {
        let store: PromptTemplateStore;

        beforeEach(async () => {
            adapter.items = [makeTemplate({ id: "a" }), makeTemplate({ id: "b" })];
            storage.setItem(STORAGE_KEY, "[]");
            store = new PromptTemplateStore(adapter);
            await store.initPromise;
        });

        it("removes the template from storage and state", async () => {
            await store.delete("a");

            expect(adapter.items.map((t) => t.id)).toEqual(["b"]);
            expect(store.templates.map((t) => t.id)).toEqual(["b"]);
        });

        it("keeps the template in state when the adapter fails to delete it", async () => {
            adapter.delete.mockRejectedValue(new Error("delete failed"));

            await expect(store.delete("a")).rejects.toThrow("delete failed");
            expect(store.templates.map((t) => t.id)).toEqual(["a", "b"]);
        });
    });
});
