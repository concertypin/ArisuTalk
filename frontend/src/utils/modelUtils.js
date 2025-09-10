/**
 * Model utility functions for handling different AI model requirements
 */

/**
 * Models that require 'max_completion_tokens' instead of 'max_tokens'
 * These are newer OpenAI models that use the updated API parameter format
 */
const MODELS_USING_MAX_COMPLETION_TOKENS = [
  // GPT-5 series
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  // o3 series
  "o3",
  "o4-mini",
  "o3-pro",
];

/**
 * Determines if a model requires 'max_completion_tokens' instead of 'max_tokens'
 * @param {string} model - The model name to check
 * @returns {boolean} True if the model requires max_completion_tokens
 */
export function shouldUseMaxCompletionTokens(model) {
  return MODELS_USING_MAX_COMPLETION_TOKENS.includes(model);
}

/**
 * Gets the correct token limit parameter name for a given model
 * @param {string} model - The model name
 * @param {number} tokenLimit - The token limit value
 * @returns {Object} Object with the correct parameter name and value
 */
export function getTokenLimitParameter(model, tokenLimit) {
  const paramName = shouldUseMaxCompletionTokens(model) 
    ? "max_completion_tokens" 
    : "max_tokens";
  
  return { [paramName]: tokenLimit };
}