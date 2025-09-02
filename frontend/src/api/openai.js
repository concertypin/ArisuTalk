import { buildContentPrompt, buildProfilePrompt, buildCharacterSheetPrompt } from "./promptBuilder.js";
import { t } from "../i18n.js";

const API_BASE_URL = "https://api.openai.com/v1";

/**
 * OpenAI ChatGPT API client class
 * Provides interface for AI conversation generation and character profile creation using ChatGPT models.
 */
export class OpenAIClient {
  /**
   * Creates an OpenAIClient instance.
   * @param {string} apiKey - OpenAI API key
   * @param {string} model - ChatGPT model to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
   * @param {string} [baseUrl=API_BASE_URL] - API base URL
   * @param {Object} [options={}] - Client options
   * @param {number} [options.maxTokens=4096] - Maximum output tokens
   * @param {number} [options.temperature=0.8] - Response creativity control (0.0-2.0)
   * @param {number} [options.profileMaxTokens=1024] - Maximum tokens for profile generation
   * @param {number} [options.profileTemperature=1.2] - Temperature setting for profile generation
   */
  constructor(apiKey, model, baseUrl = API_BASE_URL, options = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.8;
    this.profileMaxTokens = options.profileMaxTokens || 1024;
    this.profileTemperature = options.profileTemperature || 1.2;
  }

  /**
   * Generates conversation content with an AI character.
   * Uses OpenAI ChatGPT API to generate character responses to user input.
   * Can also handle image and sticker messages.
   * @param {Object} params - Content generation parameters
   * @param {string} params.userName - User name
   * @param {string} params.userDescription - User description/persona
   * @param {Object} params.character - Character information
   * @param {Array} params.history - Conversation history
   * @param {Object} params.prompts - Prompt settings
   * @param {boolean} [params.isProactive=false] - Whether this is a proactive message
   * @param {boolean} [params.forceSummary=false] - Whether to force summary
   * @returns {Promise<Object>} Generated response object
   * @returns {number} returns.reactionDelay - Reaction delay time (milliseconds)
   * @returns {Array<Object>} returns.messages - Generated message array
   * @returns {string} [returns.error] - Error message if error occurs
   * @throws {Error} When API call fails or response processing error occurs
   */
  async generateContent({
    userName,
    userDescription,
    character,
    history,
    prompts,
    isProactive = false,
    forceSummary = false,
  }) {
    const { systemPrompt, contents } = await buildContentPrompt({
      userName,
      userDescription,
      character,
      history,
      prompts,
      isProactive,
      forceSummary,
    });

    const messages = contents.map(c => ({
        role: c.role === 'model' ? 'assistant' : c.role,
        content: c.parts.map(p => p.text).join('')
    }));

    messages.unshift({ role: "system", content: systemPrompt });

    // for_update 라인 7017-7022: 요청 본문 구성
    const requestBody = {
      model: this.model,
      messages: messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    try {
      // for_update 라인 7025-7032: API 호출
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          t("api.apiError", {
            provider: "OpenAI",
            status: response.status,
            error: errorData,
          }),
        );
      }

      const data = await response.json();

      // for_update 라인 7041-7056: 응답 처리
      if (data.choices && data.choices.length > 0) {
        const textContent = data.choices[0].message.content;

        try {
          const parsedResponse = JSON.parse(textContent);
          if (
            parsedResponse.messages &&
            Array.isArray(parsedResponse.messages)
          ) {
            return parsedResponse;
          }
        } catch (e) {
          // JSON 파싱 실패시 텍스트를 단일 메시지로 처리
          return {
            reactionDelay: 1000,
            messages: [{ delay: 1000, content: textContent }],
          };
        }
      }

      throw new Error(t("api.invalidResponse", { provider: "OpenAI" }));
    } catch (error) {
      console.error("OpenAI API Error:", error);
      return { error: error.message };
    }
  }

  /**
   * Generates an AI character profile based on user information.
   * Uses OpenAI ChatGPT API to create a new character's name and prompt based on the user's name and description.
   * @param {Object} params - Profile generation parameters
   * @param {string} params.userName - User name
   * @param {string} params.userDescription - User description/characteristics
   * @param {string} params.profileCreationPrompt - Prompt for profile creation
   * @returns {Promise<Object>} Generated profile information
   * @returns {string} returns.name - Generated character name
   * @returns {string} returns.prompt - Generated character prompt
   * @returns {string} [returns.error] - Error message if error occurs
   * @throws {Error} When API call fails or JSON parsing error occurs
   */
  async generateProfile({ userName, userDescription, profileCreationPrompt }) {
    const { systemPrompt } = buildProfilePrompt({
      userName,
      userDescription,
      profileCreationPrompt,
    });

    const requestBody = {
      model: this.model,
      max_tokens: this.profileMaxTokens,
      temperature: this.profileTemperature,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            t("api.userNameLabel") +
            ` ${userName}\n` +
            t("api.userDescriptionLabel") +
            ` ${userDescription}`,
        },
      ],
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenAI Profile Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      if (
        data.choices &&
        data.choices.length > 0 &&
        data.choices[0].message?.content
      ) {
        try {
          return JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error("Profile JSON 파싱 오류:", parseError);
          throw new Error(t("api.profileParseError"));
        }
      } else {
        const reason =
          data.choices?.[0]?.finish_reason || t("api.unknownReason");
        console.warn(
          "OpenAI Profile Gen API 응답에 유효한 content가 없습니다.",
          data,
        );
        throw new Error(t("api.profileNotGenerated", { reason: reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "OpenAI" }),
        error,
      );
      return { error: error.message };
    }
  }

  /**
   * Generates a character sheet using OpenAI API.
   */
  async generateCharacterSheet({ 
    characterName, 
    characterDescription, 
    characterSheetPrompt 
  }) {
    const { systemPrompt, contents } = buildCharacterSheetPrompt({
      characterName,
      characterDescription,
      characterSheetPrompt,
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...contents.map(content => ({
        role: content.role === "model" ? "assistant" : content.role,
        content: content.parts.map(part => part.text).join("")
      }))
    ];

    const payload = {
      model: this.model,
      messages: messages,
      max_tokens: this.profileMaxOutputTokens,
      temperature: this.profileTemperature,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Character Sheet Gen API Error:", data);
        const errorMessage = data?.error?.message || 
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      if (data.choices && data.choices.length > 0) {
        const responseText = data.choices[0].message.content.trim();
        
        return {
          messages: [{ content: responseText }],
          reactionDelay: 1000,
        };
      } else {
        throw new Error(t("api.profileNotGenerated", { reason: t("api.unknownReason") }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "OpenAI" }) + " (Character Sheet)",
        error,
      );
      return { error: error.message };
    }
  }
}
