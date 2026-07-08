/**
 * @file Prompt template store — reactive state for saved prompt templates.
 * Uses LocalStoragePromptTemplateAdapter for persistence.
 */

import type { PromptTemplate, IPromptTemplateStorageAdapter } from "@/features/promptTemplate";
import { LocalStoragePromptTemplateAdapter } from "@/lib/adapters/storage/promptTemplate/LocalStoragePromptTemplateAdapter";
import { SvelteDate } from "svelte/reactivity";
import { Logger } from "@common/logger/Logger";

/**
 * Default prompt templates seeded on first load when storage is empty.
 * Users can edit or delete these freely; they only appear once.
 */
const DEFAULT_TEMPLATES: Array<Pick<PromptTemplate, "name" | "description" | "prompts">> = [
    {
        name: "Character Roleplay",
        description:
            "Standard character roleplay setup with personality, speech patterns, and backstory.",
        prompts: {
            system: `Character Profile:
Name: [Character Name]
Species/Role: [e.g. Elf, Knight, AI Assistant]
Personality: [Key traits separated by commas]
Speech: [Speaking style, quirks, catchphrases]
Backstory: [Brief background]

Goals:
- [Primary motivation]
- [Secondary motivation]

Rules:
- Stay in character at all times
- Write in third person narrative style
- React to user actions naturally
- Reference backstory when relevant`,
            generation:
                "You are acting as the character described above. Respond in character, using the established personality and speech patterns. Keep responses under 200 words unless the scene demands more.",
            lore: "[Author's Note: Focus on maintaining consistent personality traits. If the user does something unexpected, react according to the character's established nature.]",
        },
    },
    {
        name: "Creative Writing Helper",
        description: "Assists with creative writing, brainstorming, and editing.",
        prompts: {
            system: `You are a creative writing assistant with expertise in:
- Story structure (three-act, hero's journey, etc.)
- Character development and arcs
- Worldbuilding and setting
- Dialogue and pacing
- Genre conventions

When given a writing sample or prompt:
1. First identify strengths and areas for improvement
2. Offer specific suggestions, not generic advice
3. Provide examples when helpful
4. Ask clarifying questions about tone, audience, and intent

Tone: constructive, supportive, and detailed.`,
            generation:
                "Analyze the user's writing and provide actionable feedback. Start with what works well, then suggest concrete improvements.",
            lore: undefined,
        },
    },
    {
        name: "Language Tutor",
        description:
            "Interactive language learning partner with translation, grammar, and conversation practice.",
        prompts: {
            system: `You are a supportive language tutor. Your approach:
- Correct mistakes gently and explain why
- Provide alternative expressions with nuance
- Track the user's level and adjust difficulty
- Offer cultural context when relevant
- Encourage practice through conversation

When the user writes in their target language:
1. First acknowledge what they did well
2. Correct any errors with explanation
3. Suggest more natural alternatives
4. Ask a follow-up question to keep the conversation flowing

When they write in English/their native language:
1. Respond in the target language at an appropriate level
2. Include a brief English translation for new expressions`,
            generation:
                "Respond as a patient language tutor. Match the user's current level and gently challenge them to improve.",
            lore: "[Author's Note: If the user seems frustrated, switch to encouragement mode. Celebrate small wins.]",
        },
    },
];

/**
 * Generates a simple unique ID (nanoid-style).
 * Uses crypto.randomUUID when available, falls back to timestamp + random.
 */
function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export class PromptTemplateStore {
    /** All saved prompt templates. */
    templates = $state<PromptTemplate[]>([]);
    /** Whether the store has finished initial loading. */
    loaded = $state(false);

    private adapter: IPromptTemplateStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IPromptTemplateStorageAdapter) {
        this.adapter = adapter || new LocalStoragePromptTemplateAdapter();
        this.initPromise = this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            await this.adapter.init();
            await this.load();
        } catch (err) {
            Logger.error("PromptTemplateStore: initialization failed", err);
        }
    }

    /**
     * Load all templates from storage into state.
     */
    async load(): Promise<void> {
        try {
            this.templates = await this.adapter.getAll();

            // Seed default templates on first visit only (localStorage key doesn't exist yet).
            // After seeding, removing all templates won't trigger re-seeding because the key
            // still exists (empty array `[]`).
            const STORAGE_KEY = "arisutalk_prompt_templates";
            const isFirstVisit = localStorage.getItem(STORAGE_KEY) === null;
            if (isFirstVisit && this.templates.length === 0) {
                const now = new SvelteDate();
                const timestamp = now.toISOString();
                for (const seed of DEFAULT_TEMPLATES) {
                    await this.adapter.save({
                        id: generateId(),
                        ...seed,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    });
                }
                // Reload after seeding
                this.templates = await this.adapter.getAll();
                Logger.info(
                    `[PromptTemplate] Seeded ${DEFAULT_TEMPLATES.length} default templates`
                );
            }
        } catch (err) {
            Logger.error("PromptTemplateStore: failed to load templates", err);
            this.templates = [];
        } finally {
            this.loaded = true;
        }
    }

    /**
     * Create a new prompt template and persist it.
     */
    async create(data: {
        name: string;
        description: string;
        prompts: PromptTemplate["prompts"];
    }): Promise<PromptTemplate> {
        const now = new SvelteDate().toISOString();
        const template: PromptTemplate = {
            id: generateId(),
            name: data.name,
            description: data.description,
            prompts: data.prompts,
            createdAt: now,
            updatedAt: now,
        };
        await this.adapter.save(template);
        this.templates = [...this.templates, template];
        return template;
    }

    /**
     * Update an existing prompt template.
     */
    async update(
        id: string,
        data: Partial<Pick<PromptTemplate, "name" | "description" | "prompts">>
    ): Promise<void> {
        const existing = this.templates.find((t) => t.id === id);
        if (!existing) {
            Logger.warn(`PromptTemplateStore: template "${id}" not found for update`);
            return;
        }
        const updated: PromptTemplate = {
            ...existing,
            ...data,
            updatedAt: new SvelteDate().toISOString(),
        };
        await this.adapter.save(updated);
        this.templates = this.templates.map((t) => (t.id === id ? updated : t));
    }

    /**
     * Delete a prompt template by ID.
     */
    async delete(id: string): Promise<void> {
        await this.adapter.delete(id);
        this.templates = this.templates.filter((t) => t.id !== id);
    }
}

/** Singleton prompt template store instance. */
export const promptTemplateStore = new PromptTemplateStore();
