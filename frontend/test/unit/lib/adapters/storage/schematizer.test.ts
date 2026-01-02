import { describe, it, expect } from "vitest";
import { getTablesSchema, applySchema } from "@/lib/adapters/storage/schematizer";

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

    it("applySchema returns the schema object", () => {
        const schema = applySchema();
        expect(schema).toBeDefined();
        expect(schema.characters).toBeDefined();
    });
});
