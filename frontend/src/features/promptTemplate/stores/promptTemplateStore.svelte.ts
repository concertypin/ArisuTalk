/**
 * @file Prompt template store — reactive state for saved prompt templates.
 * Uses LocalStoragePromptTemplateAdapter for persistence.
 */

import type { PromptTemplate, IPromptTemplateStorageAdapter } from "@/features/promptTemplate";
import { LocalStoragePromptTemplateAdapter } from "@/lib/adapters/storage/promptTemplate/LocalStoragePromptTemplateAdapter";
import { Logger } from "@common/logger/Logger";
import { SvelteDate } from "svelte/reactivity";

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
