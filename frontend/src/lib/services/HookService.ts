import { getRegexWorker, getScriptingWorker } from "@/lib/workers/workerClient";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import type { Persona } from "@/features/persona/schema";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";
import type { ScriptContext } from "@worker/scripting/types";

export type HookType = "input" | "output" | "display";

export class HookService {
    /**
     * Processes a message through the specified hooks.
     * @param content The message content to process.
     * @param character The character whose hooks to apply.
     * @param type The type of hooks to apply.
     * @param persona The current persona (for permission checks).
     * @returns The processed content.
     */
    async process(
        content: string,
        character: Character,
        type: HookType,
        persona?: Persona
    ): Promise<string> {
        const hooks = character.executables?.replaceHooks?.[type] || [];
        if (hooks.length === 0) return content;

        // Sort by priority (higher first)
        const sortedHooks = [...hooks].sort((a, b) => b.meta.priority - a.meta.priority);

        let result = content;

        for (const hook of sortedHooks) {
            result = await this.applyHook(result, hook, character, persona);
        }

        return result;
    }

    private async applyHook(
        content: string,
        hook: Character["executables"]["replaceHooks"]["input"][number],
        character: Character,
        persona?: Persona
    ): Promise<string> {
        const regexWorker = await getRegexWorker();
        const scriptingWorker = await getScriptingWorker();

        let pattern = hook.input;
        let replacement = hook.output;

        const allowNetwork = persona?.allowLowLevelAccess ?? false;

        // 1. Resolve scripted input pattern if needed
        if (hook.meta.isInputPatternScripted) {
            const scriptResult = await scriptingWorker.execute(pattern, {
                context: this.createContext(content, character, persona),
                allowNetwork,
            });
            if (scriptResult.error) {
                console.error("Hook input script error:", scriptResult.error);
            } else if (scriptResult.result !== undefined && scriptResult.result !== null) {
                pattern = String(scriptResult.result as unknown);
            }
        }

        // 2. Perform replacement
        if (hook.meta.type === "regex") {
            // If output is scripted, we might need a different approach.
            // For now, if output is scripted, we evaluate it as a function or expression.
            // Simplified: Just evaluate the script once.
            if (hook.meta.isOutputScripted) {
                // This is complex: native replace(re, (match) => script)
                // We'll approximate by evaluating the script with the match context.
                const scriptResult = await scriptingWorker.execute(replacement, {
                    context: this.createContext(content, character, persona),
                    allowNetwork,
                });
                if (scriptResult.result !== undefined && scriptResult.result !== null) {
                    replacement = String(scriptResult.result as unknown);
                }
            }

            return await regexWorker.replace(content, pattern, replacement, hook.meta.flag);
        } else {
            // String replacement
            if (hook.meta.isOutputScripted) {
                const scriptResult = await scriptingWorker.execute(replacement, {
                    context: this.createContext(content, character, persona),
                    allowNetwork,
                });
                if (scriptResult.result !== undefined && scriptResult.result !== null) {
                    replacement = String(scriptResult.result as unknown);
                }
            }

            const flags = hook.meta.caseSensitive ? "g" : "gi";
            return await regexWorker.replace(
                content,
                this.escapeRegExp(pattern),
                replacement,
                flags
            );
        }
    }

    private createContext(content: string, _character: Character, persona?: Persona): ScriptContext {
        const message = apply(MessageSchema, {
            id: crypto.randomUUID(),
            chatId: "temp-hook-chat-id", // Hooks run outside of a specific chat instance sometimes or before chatId is known
            content: { type: "text", data: content },
            role: "assistant",
        });

        return {
            message: {
                content: message.content.type === "text" ? message.content.data : "",
                role: message.role,
                metadata: {}, // Current MessageSchema doesn't have metadata, adding empty for ScriptContext
            },
            persona: persona
                ? {
                      name: persona.name,
                      id: persona.id,
                  }
                : undefined,
        };
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$& ");
    }
}

export const hookService = new HookService();
