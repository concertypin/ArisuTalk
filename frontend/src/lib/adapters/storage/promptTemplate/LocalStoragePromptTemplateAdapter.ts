import type { IPromptTemplateStorageAdapter } from "@/lib/interfaces/IPromptTemplateStorageAdapter";
import type { PromptTemplate } from "@/lib/types/promptTemplate";
import { Logger } from "@common/logger/Logger";

const STORAGE_KEY = "arisutalk_prompt_templates";

/**
 * LocalStorage-based prompt template storage adapter.
 * Templates are small text blobs, ideal for localStorage.
 */
export class LocalStoragePromptTemplateAdapter implements IPromptTemplateStorageAdapter {
    async init(): Promise<void> {
        if (!import.meta.env.DEV) {
            Logger.warn("LocalStoragePromptTemplateAdapter is for development/testing only.");
        }
        return Promise.resolve();
    }

    private getStored(): PromptTemplate[] {
        const item = localStorage.getItem(STORAGE_KEY);
        if (!item) return [];
        try {
            const parsed: unknown = JSON.parse(item);
            if (!Array.isArray(parsed)) return [];
            // Basic structural validation using in-narrowing to avoid type assertions
            return parsed.filter((t: unknown): t is PromptTemplate => {
                if (typeof t !== "object" || t === null) return false;
                if (!("id" in t) || !("name" in t)) return false;
                return typeof t.id === "string" && typeof t.name === "string";
            });
        } catch {
            return [];
        }
    }

    private setStored(data: PromptTemplate[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    async getAll(): Promise<PromptTemplate[]> {
        return this.getStored();
    }

    async get(id: string): Promise<PromptTemplate | undefined> {
        const templates = this.getStored();
        return templates.find((t) => t.id === id);
    }

    async save(template: PromptTemplate): Promise<void> {
        const templates = this.getStored();
        const index = templates.findIndex((t) => t.id === template.id);

        if (index >= 0) {
            templates[index] = template;
        } else {
            templates.push(template);
        }
        this.setStored(templates);
    }

    async delete(id: string): Promise<void> {
        const templates = this.getStored();
        const filtered = templates.filter((t) => t.id !== id);
        this.setStored(filtered);
    }
}

export default LocalStoragePromptTemplateAdapter;
