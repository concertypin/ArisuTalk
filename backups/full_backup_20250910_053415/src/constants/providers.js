/**
 * AI Provider constants and configurations
 * Centralized configuration for all supported AI providers
 */

// Supported AI providers
export const PROVIDERS = {
  GEMINI: "gemini",
  CLAUDE: "claude",
  OPENAI: "openai",
  GROK: "grok",
  OPENROUTER: "openrouter",
  CUSTOM_OPENAI: "custom_openai",
};

// Array of all supported providers
export const SUPPORTED_PROVIDERS = [
  PROVIDERS.GEMINI,
  PROVIDERS.CLAUDE,
  PROVIDERS.OPENAI,
  PROVIDERS.GROK,
  PROVIDERS.OPENROUTER,
  PROVIDERS.CUSTOM_OPENAI,
];

// Default provider
export const DEFAULT_PROVIDER = PROVIDERS.GEMINI;

// Provider display names
export const PROVIDER_NAMES = {
  [PROVIDERS.GEMINI]: "Gemini",
  [PROVIDERS.CLAUDE]: "Claude",
  [PROVIDERS.OPENAI]: "OpenAI",
  [PROVIDERS.GROK]: "Grok",
  [PROVIDERS.OPENROUTER]: "OpenRouter",
  [PROVIDERS.CUSTOM_OPENAI]: "Custom OpenAI",
};

// Default models for each provider
export const PROVIDER_MODELS = {
  [PROVIDERS.GEMINI]: ["gemini-2.5-pro", "gemini-2.5-flash"],
  [PROVIDERS.CLAUDE]: [
    "claude-opus-4-1-20250805",
    "claude-opus-4-20250514",
    "claude-sonnet-4-20250514",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307",
  ],
  [PROVIDERS.OPENAI]: [
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    "o3",
    "o4-mini",
    "o3-pro",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4.1",
  ],
  [PROVIDERS.GROK]: ["grok-4", "grok-3", "grok-3-mini"],
  [PROVIDERS.OPENROUTER]: [], // 커스텀 모델만 지원
  [PROVIDERS.CUSTOM_OPENAI]: [], // 커스텀 모델만 지원
};

// Default models for each provider
export const DEFAULT_MODELS = {
  [PROVIDERS.GEMINI]: "gemini-2.5-flash",
  [PROVIDERS.CLAUDE]: "claude-sonnet-4-20250514",
  [PROVIDERS.OPENAI]: "gpt-4o",
  [PROVIDERS.GROK]: "grok-3",
  [PROVIDERS.OPENROUTER]: "",
  [PROVIDERS.CUSTOM_OPENAI]: "",
};

/**
 * Check if a provider is supported
 * @param {string} provider - The provider name to check
 * @returns {boolean} Whether the provider is supported
 */
export function isProviderSupported(provider) {
  return SUPPORTED_PROVIDERS.includes(provider);
}

/**
 * Get provider display name
 * @param {string} provider - The provider key
 * @returns {string} The display name
 */
export function getProviderDisplayName(provider) {
  return PROVIDER_NAMES[provider] || provider;
}

/**
 * Get default models for a provider
 * @param {string} provider - The provider key
 * @returns {Array<string>} Array of model names
 */
export function getProviderModels(provider) {
  return PROVIDER_MODELS[provider] || [];
}

/**
 * Get default model for a provider
 * @param {string} provider - The provider key
 * @returns {string} Default model name
 */
export function getDefaultModel(provider) {
  return DEFAULT_MODELS[provider] || "";
}
