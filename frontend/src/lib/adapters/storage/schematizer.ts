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

export function getTablesSchema() {
    return SchemaDefinition;
}

export function applySchema() {
    return getTablesSchema();
}
