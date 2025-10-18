import {
    PROVIDERS,
    SUPPORTED_PROVIDERS,
    isProviderSupported,
} from "$/constants/providers.ts";
import type {
    LLMApi,
    LLMApiConstructor,
    LLMApiConstructorOptions,
    LLMApiGenerateCharacterSheetParams,
    LLMApiGenerateCharacterSheetResponse,
    LLMApiGenerateContentParams,
    LLMApiGenerateContentResponse,
    LLMApiGenerateProfileParams,
    LLMApiGenerateProfileResponse,
} from "$/lib/api/llm/llmApiProto";
import { t } from "i18n";

/**
 * API Manager that handles multiple AI providers
 * Provides a unified interface for all supported AI APIs
 */
export class APIManager {
    clients: Record<string, LLMApi> = {};
    constructor() {
        this.clients = {};
    }

    /**
     * Resolve actual API key from potentially encrypted placeholder
     * @param provider - The API provider
     * @param apiKey - The API key (might be encrypted placeholder)
     * @returns The actual API key
     */
    async resolveApiKey(provider: string, apiKey: string): Promise<string> {
        // If it's an encrypted placeholder, get the real key from PersonaChatApp
        if (apiKey === "***encrypted***" || !apiKey) {
            if (window.personaApp) {
                return await window.personaApp.getApiKey(provider);
            }
            throw new Error(t("api.apiKeyNotFound"));
        }
        return apiKey;
    }

    /**
     * Creates and returns the appropriate API client based on provider
     * @param provider - The API provider (see PROVIDERS constants)
     * @param apiKey - The API key for the provider
     * @param model - The model to use
     * @param baseUrl - Custom base URL (for custom_openai only)
     * @param options - Additional options for the client (for custom_openai only)
     * @returns The API client instance
     */
    async getClient(
        provider: string,
        apiKey: string,
        model: string,
        baseUrl: string | null = null,
        options: LLMApiConstructorOptions = {}
    ): Promise<LLMApi> {
        // Map provider to client import
        // Used "as" syntax, because when writing type directly, it is ugly due to auto-formatting
        const providerMap = {
            [PROVIDERS.GEMINI]: () => import("$/lib/api/llm/gemini"),
            [PROVIDERS.CLAUDE]: () => import("$/lib/api/llm/claude"),
            [PROVIDERS.OPENAI]: () => import("$/lib/api/llm/openai"),
            [PROVIDERS.GROK]: () => import("$/lib/api/llm/grok"),
            [PROVIDERS.OPENROUTER]: () => import("$/lib/api/llm/openrouter"),
            [PROVIDERS.CUSTOM_OPENAI]: () =>
                import("$/lib/api/llm/customopenai"),
        } as Record<
            (typeof PROVIDERS)[keyof typeof PROVIDERS],
            () => Promise<{ default: LLMApiConstructor }>
        >;
        const clientKey = `${provider}_${model}`;

        // Return existing client if available
        if (this.clients[clientKey]) {
            return this.clients[clientKey];
        }
        if (!(provider in providerMap))
            throw new Error(t("api.providerNotSupported", { provider }));

        const client = (await providerMap[provider]()).default;

        this.clients[clientKey] = new client(
            apiKey,
            model,
            baseUrl || null,
            options
        );
        return this.clients[clientKey];
    }

    /**
     * Generate content using the specified provider
     * @param provider - The API provider
     * @param apiKey - The API key
     * @param model - The model to use
     * @param params - Parameters for content generation
     * @param baseUrl - Custom base URL (for custom_openai only)
     * @param options - Additional options for the client (for custom_openai only)
     * @returns The generated content response
     */
    async generateContent(
        provider: string,
        apiKey: string,
        model: string,
        params: LLMApiGenerateContentParams,
        baseUrl: string | null = null,
        options: object = {}
    ): LLMApiGenerateContentResponse {
        try {
            // Resolve actual API key if encrypted
            const actualApiKey = await this.resolveApiKey(provider, apiKey);
            const client = await this.getClient(
                provider,
                actualApiKey,
                model,
                baseUrl,
                options
            );
            const response = await client.generateContent(params);
            return response;
        } catch (error) {
            throw error; // Re-throw the error after logging
        }
    }

    /**
     * Generate a character profile using the specified provider
     * @param provider - The API provider
     * @param apiKey - The API key
     * @param model - The model to use
     * @param params - Parameters for profile generation
     * @param baseUrl - Custom base URL (for custom_openai only)
     * @param options - Additional options for the client (for custom_openai only)
     * @returns  The generated profile response
     */
    async generateProfile(
        provider: string,
        apiKey: string,
        model: string,
        params: LLMApiGenerateProfileParams,
        baseUrl: string | null = null,
        options: object = {}
    ): LLMApiGenerateProfileResponse {
        try {
            // Resolve actual API key if encrypted
            const actualApiKey = await this.resolveApiKey(provider, apiKey);
            const client = await this.getClient(
                provider,
                actualApiKey,
                model,
                baseUrl,
                options
            );
            const response = await client.generateProfile(params);
            return response;
        } catch (error) {
            throw error; // Re-throw the error after logging
        }
    }

    /**
     * Generate a character sheet using the specified provider
     * @param provider - The API provider
     * @param apiKey - The API key
     * @param model - The model to use
     * @param params - Parameters for character sheet generation
     * @param baseUrl - Custom base URL (for custom_openai only)
     * @param options - Additional options for the client (for custom_openai only)
     * @returns {Promise<Object>} The generated character sheet response
     */
    async generateCharacterSheet(
        provider: string,
        apiKey: string,
        model: string,
        params: LLMApiGenerateCharacterSheetParams,
        baseUrl: string | null = null,
        options: object = {}
    ): LLMApiGenerateCharacterSheetResponse {
        try {
            // Resolve actual API key if encrypted
            const actualApiKey = await this.resolveApiKey(provider, apiKey);
            const client = await this.getClient(
                provider,
                actualApiKey,
                model,
                baseUrl,
                options
            );
            const response = await client.generateCharacterSheet(params);
            return response;
        } catch (error) {
            throw error; // Re-throw the error after logging
        }
    }

    /**
     * Clear cached clients (useful when API keys change)
     */
    clearClients() {
        this.clients = {};
    }

    /**
     * Get list of supported providers
     */
    getSupportedProviders(): typeof SUPPORTED_PROVIDERS {
        return SUPPORTED_PROVIDERS;
    }

    /**
     * Check if a provider is supported
     * @param provider - The provider name to check
     * @returns {boolean} Whether the provider is supported
     */
    isProviderSupported(provider: string): boolean {
        return isProviderSupported(provider);
    }
}
