import { createZodSchematizer } from "tinybase/schematizers/schematizer-zod";

import type { Store } from "tinybase";
import { CharacterSchema, ChatSchema } from "@arisutalk/character-spec/v0/Character";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { PersonaSchema } from "@/features/persona/schema";
import { SettingsSchema } from "@/lib/types/IDataModel";

const SchemaDefinition = {
    characters: CharacterSchema,
    chats: ChatSchema,
    messages: MessageSchema,
    personas: PersonaSchema,
    settings: SettingsSchema,
};

export const schematizer = createZodSchematizer();

export function getTablesSchema() {
    return schematizer.toTablesSchema(SchemaDefinition);
}

export function applySchema(store: Store) {
    const tablesSchema = getTablesSchema();
    store.setTablesSchema(tablesSchema);
    return tablesSchema;
}
