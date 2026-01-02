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
        persona?: Persona,
        role?: "user" | "assistant"
    ): Promise<string> {
        const hooks = character.executables?.replaceHooks?.[type] || [];
        if (hooks.length === 0) return content;

        // Sort by priority (higher first)
        const sortedHooks = [...hooks].sort((a, b) => b.meta.priority - a.meta.priority);

        // Get workers once, outside the loop (performance optimization)
        const regexWorker = await getRegexWorker();
        const scriptingWorker = await getScriptingWorker();

        let result = content;

        for (const hook of sortedHooks) {
            result = await this.applyHook(
                result,
                hook,
                character,
                type,
                persona,
                regexWorker,
                scriptingWorker,
                role
            );
        }

        return result;
    }

    private async applyHook(
        content: string,
        hook: Character["executables"]["replaceHooks"]["input"][number],
        character: Character,
        type: HookType,
        persona: Persona | undefined,
        regexWorker: Awaited<ReturnType<typeof getRegexWorker>>,
        scriptingWorker: Awaited<ReturnType<typeof getScriptingWorker>>,
        role?: "user" | "assistant"
    ): Promise<string> {
        let pattern = hook.input;
        let replacement = hook.output;

        const allowNetwork = persona?.allowLowLevelAccess ?? false;

        // 1. Resolve scripted input pattern if needed
        if (hook.meta.isInputPatternScripted) {
            const scriptResult = await scriptingWorker.execute(pattern, {
                context: this.createContext(content, character, type, persona, role),
                allowNetwork,
                characterId: character.id,
            });
            if (scriptResult.error) {
                console.error("Hook input script error:", scriptResult.error);
            } else if (scriptResult.result !== undefined && scriptResult.result !== null) {
                pattern = String(scriptResult.result as unknown);
            }
        }

        // 2. Perform replacement
        if (hook.meta.type === "regex") {
            // Scripted output: The script is evaluated ONCE, and the result is used as the replacement
            // string for ALL matches. This is a simplified implementation - for per-match evaluation
            // (like JS replace callback), the logic would need to move into the worker.
            // See REVIEW.md L71 for design notes.
            if (hook.meta.isOutputScripted) {
                // This is complex: native replace(re, (match) => script)
                // We'll approximate by evaluating the script with the match context.
                const scriptResult = await scriptingWorker.execute(replacement, {
                    context: this.createContext(content, character, type, persona, role),
                    allowNetwork,
                    characterId: character.id,
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
                    context: this.createContext(content, character, type, persona, role),
                    allowNetwork,
                    characterId: character.id,
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

    private createContext(
        content: string,
        _character: Character,
        type: HookType,
        persona?: Persona,
        role?: "user" | "assistant"
    ): ScriptContext {
        const message = apply(MessageSchema, {
            id: crypto.randomUUID(),
            chatId: "temp-hook-chat-id", // Hooks run outside of a specific chat instance sometimes or before chatId is known
            content: { type: "text", data: content },
            // Role is explicit if provided, otherwise determined by hook type:
            // input hooks process user messages, output/display hooks process assistant messages
            role: role || this.getRoleForHookType(type),
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

    private getRoleForHookType(type: HookType): "user" | "assistant" {
        switch (type) {
            case "input":
                return "user";
            case "output":
            case "display":
                return "assistant";
        }
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
}

export const hookService = new HookService();
