import { t } from "../../i18n.js";
import { GeminiClient } from "./gemini.js";
import { ClaudeClient } from "./claude.js";
import { OpenAIClient } from "./openai.js";
import { GrokClient } from "./grok.js";
import { OpenRouterClient } from "./openrouter.js";
import { CustomOpenAIClient } from "./customopenai.js";
import {
  PROVIDERS,
  SUPPORTED_PROVIDERS,
  isProviderSupported,
} from "../../constants/providers.ts";

import { secureStorage } from "../utils/secureStorage.js";
import { addLog } from '../services/logService.ts';

/**
 * API Manager that handles multiple AI providers
 * Provides a unified interface for all supported AI APIs
 */
export class APIManager {
  constructor() {
    this.clients = {};
  }

  /**
   * Resolve actual API key from potentially encrypted placeholder
   * @param {string} provider - The API provider
   * @param {string} apiKey - The API key (might be encrypted placeholder)
   * @returns {Promise<string>} - The actual API key
   */
  async resolveApiKey(provider, apiKey) {
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
   * @param {string} provider - The API provider (see PROVIDERS constants)
   * @param {string} apiKey - The API key for the provider
   * @param {string} model - The model to use
   * @param {string} [baseUrl] - Custom base URL (for custom_openai only)
   * @param {Object} [options] - Additional options for the client (for custom_openai only)
   * @returns {Object} The API client instance
   */
  getClient(provider, apiKey, model, baseUrl = null, options = {}) {
    const clientKey = `${provider}_${model}`;

    // Return existing client if available
    if (this.clients[clientKey]) {
      return this.clients[clientKey];
    }

    let client;
    switch (provider) {
      case PROVIDERS.GEMINI:
        client = new GeminiClient(apiKey, model, baseUrl || undefined, options);
        break;
      case PROVIDERS.CLAUDE:
        client = new ClaudeClient(apiKey, model, baseUrl || undefined, options);
        break;
      case PROVIDERS.OPENAI:
        client = new OpenAIClient(apiKey, model, baseUrl || undefined, options);
        break;
      case PROVIDERS.GROK:
        client = new GrokClient(apiKey, model, baseUrl || undefined, options);
        break;
      case PROVIDERS.OPENROUTER:
        client = new OpenRouterClient(
          apiKey,
          model,
          baseUrl || undefined,
          options,
        );
        break;
      case PROVIDERS.CUSTOM_OPENAI:
        client = new CustomOpenAIClient(apiKey, model, baseUrl, options);
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
   * @param {Object} [options] - Additional options for the client (for custom_openai only)
   * @returns {Promise<Object>} The generated content response
   */
  async generateContent(
    provider,
    apiKey,
    model,
    params,
    baseUrl = null,
    options = {},
  ) {


    try {
      // Resolve actual API key if encrypted
      const actualApiKey = await this.resolveApiKey(provider, apiKey);
      const client = this.getClient(
        provider,
        actualApiKey,
        model,
        baseUrl,
        options,
      );
      const response = await client.generateContent(params);



      return response;
    } catch (error) {
      throw error; // Re-throw the error after logging
    }
  }

  /**
   * Generate a character profile using the specified provider
   * @param {string} provider - The API provider
   * @param {string} apiKey - The API key
   * @param {string} model - The model to use
   * @param {Object} params - Parameters for profile generation
   * @param {string} [baseUrl] - Custom base URL (for custom_openai only)
   * @param {Object} [options] - Additional options for the client (for custom_openai only)
   * @returns {Promise<Object>} The generated profile response
   */
  async generateProfile(
    provider,
    apiKey,
    model,
    params,
    baseUrl = null,
    options = {},
  ) {


    try {
      // Resolve actual API key if encrypted
      const actualApiKey = await this.resolveApiKey(provider, apiKey);
      const client = this.getClient(
        provider,
        actualApiKey,
        model,
        baseUrl,
        options,
      );
      const response = await client.generateProfile(params);



      return response;
    } catch (error) {
      throw error; // Re-throw the error after logging
    }
  }

  /**
   * Generate a character sheet using the specified provider
   * @param {string} provider - The API provider
   * @param {string} apiKey - The API key
   * @param {string} model - The model to use
   * @param {Object} params - Parameters for character sheet generation
   * @param {string} [baseUrl] - Custom base URL (for custom_openai only)
   * @param {Object} [options] - Additional options for the client (for custom_openai only)
   * @returns {Promise<Object>} The generated character sheet response
   */
  async generateCharacterSheet(
    provider,
    apiKey,
    model,
    params,
    baseUrl = null,
    options = {},
  ) {


    try {
      // Resolve actual API key if encrypted
      const actualApiKey = await this.resolveApiKey(provider, apiKey);
      const client = this.getClient(
        provider,
        actualApiKey,
        model,
        baseUrl,
        options,
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
   * @returns {import("../constants/providers.js").SUPPORTED_PROVIDERS}
   */
  getSupportedProviders() {
    return SUPPORTED_PROVIDERS;
  }

  /**
   * Check if a provider is supported
   * @param {string} provider - The provider name to check
   * @returns {boolean} Whether the provider is supported
   */
  isProviderSupported(provider) {
    return isProviderSupported(provider);
  }
}
