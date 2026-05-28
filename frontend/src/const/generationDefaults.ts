/**
 * Default values for LLM generation parameters.
 */
export const GENERATION_DEFAULTS = {
    temperature: 1,
    maxInputTokens: 1024,
    maxOutputTokens: 1024,
    topP: 0.95,
    topK: 40,
    frequencyPenalty: 0,
    presencePenalty: 0,
} as const;
