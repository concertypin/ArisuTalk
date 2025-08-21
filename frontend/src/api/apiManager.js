import { GeminiClient } from './gemini.js';
import { ClaudeClient } from './claude.js';
import { OpenAIClient } from './openai.js';
import { GrokClient } from './grok.js';
import { OpenRouterClient } from './openrouter.js';
import { CustomOpenAIClient } from './customopenai.js';

/**
 * API Manager that handles multiple AI providers
 * Provides a unified interface for all supported AI APIs
 */
export class APIManager {
    constructor() {
        this.clients = {};
    }

    /**
     * Creates and returns the appropriate API client based on provider
     * @param {string} provider - The API provider (gemini, claude, openai, grok, openrouter, custom_openai)
     * @param {string} apiKey - The API key for the provider
     * @param {string} model - The model to use
     * @param {string} [baseUrl] - Custom base URL (for custom_openai only)
     * @returns {Object} The API client instance
     */
    getClient(provider, apiKey, model, baseUrl = null) {
        const clientKey = `${provider}_${model}`;
        
        // Return existing client if available
        if (this.clients[clientKey]) {
            return this.clients[clientKey];
        }

        let client;
        switch (provider) {
            case 'gemini':
                client = new GeminiClient(apiKey, model);
                break;
            case 'claude':
                client = new ClaudeClient(apiKey, model);
                break;
            case 'openai':
                client = new OpenAIClient(apiKey, model);
                break;
            case 'grok':
                client = new GrokClient(apiKey, model);
                break;
            case 'openrouter':
                client = new OpenRouterClient(apiKey, model);
                break;
            case 'custom_openai':
                client = new CustomOpenAIClient(apiKey, model, baseUrl);
                break;
            default:
                throw new Error(`Unsupported API provider: ${provider}`);
        }

        this.clients[clientKey] = client;
        return client;
    }

    /**
     * Generate content using the specified provider
     * @param {string} provider - The API provider
     * @param {string} apiKey - The API key
     * @param {string} model - The model to use
     * @param {Object} params - Parameters for content generation
     * @param {string} [baseUrl] - Custom base URL (for custom_openai only)
     * @returns {Promise<Object>} The generated content response
     */
    async generateContent(provider, apiKey, model, params, baseUrl = null) {
        const client = this.getClient(provider, apiKey, model, baseUrl);
        return await client.generateContent(params);
    }

    /**
     * Generate a character profile using the specified provider
     * @param {string} provider - The API provider
     * @param {string} apiKey - The API key
     * @param {string} model - The model to use
     * @param {Object} params - Parameters for profile generation
     * @param {string} [baseUrl] - Custom base URL (for custom_openai only)
     * @returns {Promise<Object>} The generated profile response
     */
    async generateProfile(provider, apiKey, model, params, baseUrl = null) {
        const client = this.getClient(provider, apiKey, model, baseUrl);
        return await client.generateProfile(params);
    }

    /**
     * Clear cached clients (useful when API keys change)
     */
    clearClients() {
        this.clients = {};
    }

    /**
     * Get list of supported providers
     * @returns {Array<string>} List of supported provider names
     */
    getSupportedProviders() {
        return ['gemini', 'claude', 'openai', 'grok', 'openrouter', 'custom_openai'];
    }

    /**
     * Check if a provider is supported
     * @param {string} provider - The provider name to check
     * @returns {boolean} Whether the provider is supported
     */
    isProviderSupported(provider) {
        return this.getSupportedProviders().includes(provider);
    }
}