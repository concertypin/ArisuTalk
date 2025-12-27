
import { describe, it, expect, vi } from "vitest";
import { getTablesSchema, applySchema } from "@/lib/adapters/storage/schematizer";
import { type Store } from "tinybase";

describe("schematizer", () => {
    it("getTablesSchema returns a schema object", () => {
        const schema = getTablesSchema();
        expect(schema).toBeDefined();
        const keys = Object.keys(schema);
        expect(keys).toContain("characters");
        expect(keys).toContain("chats");
        expect(keys).toContain("messages");
        expect(keys).toContain("personas");
    });

    it("applySchema sets the schema on the store", () => {
        // Mock store with Store interface
        const mockStore = {
            setTablesSchema: vi.fn(),
        } satisfies Partial<Store>;

        // We need to cast it to Store because it doesn't implement the full interface
        applySchema(mockStore as unknown as Store);

        expect(mockStore.setTablesSchema).toHaveBeenCalled();
        expect(mockStore.setTablesSchema).toHaveBeenCalledWith(expect.anything());
    });
});
