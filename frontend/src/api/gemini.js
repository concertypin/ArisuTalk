import { buildContentPrompt, buildProfilePrompt, buildCharacterSheetPrompt } from "../prompts/builder/promptBuilder.js";
import { t } from "../i18n.js";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Google Gemini API client class
 * Provides interface for AI conversation generation and character profile creation using Gemini API.
 */
export class GeminiClient {
  /**
   * Creates a GeminiClient instance.
   * @param {string} apiKey - Google Gemini API key
   * @param {string} model - Gemini model to use (e.g., 'gemini-2.5-flash')
   * @param {string} [baseUrl=API_BASE_URL] - API base URL
   * @param {Object} [options={}] - Client options
   * @param {number} [options.maxTokens=4096] - Maximum output tokens
   * @param {number} [options.temperature=1.25] - Response creativity control (0.0-2.0)
   * @param {number} [options.profileMaxTokens=1024] - Maximum tokens for profile generation
   * @param {number} [options.profileTemperature=1.2] - Temperature setting for profile generation
   */
  constructor(apiKey, model, baseUrl = API_BASE_URL, options = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.maxOutputTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 1.25;
    this.profileMaxOutputTokens = options.profileMaxTokens || 1024;
    this.profileTemperature = options.profileTemperature || 1.2;
  }

  /**
   * Generates conversation content with an AI character.
   * Creates character responses to user input and returns structured JSON response.
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
   * @returns {string} [returns.newMemory] - New memory
   * @returns {Object} [returns.characterState] - Character state
   * @throws {Error} When API call fails or JSON parsing error occurs
   */
  async generateContent({
    userName,
    userDescription,
    character,
    history,
    prompts,
    isProactive = false,
    forceSummary = false,
    characterState = null,
  }) {
    const { contents, systemPrompt } = await buildContentPrompt({
      userName,
      userDescription,
      character,
      history,
      prompts,
      isProactive,
      forceSummary,
      characterState,
    });

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: this.temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: this.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            reactionDelay: { type: "INTEGER" },
            messages: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  delay: { type: "INTEGER" },
                  content: { type: "STRING" },
                  sticker: { type: "STRING" },
                },
                required: ["delay"],
              },
            },
            characterState: {
              type: "OBJECT",
              properties: {
                affection: { type: "NUMBER" },
                intimacy: { type: "NUMBER" },
                trust: { type: "NUMBER" },
                romantic_interest: { type: "NUMBER" },
                reason: { type: "STRING" },
              },
              required: ["affection", "intimacy", "trust", "romantic_interest"],
            },
            autoPost: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING" },
                content: { type: "STRING" },
                access_level: { type: "STRING" },
                importance: { type: "NUMBER" },
                tags: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                emotion: { type: "STRING" },
                reason: { type: "STRING" }
              },
              required: ["type", "content", "access_level"]
            },
            autoGenerateSticker: {
              type: "OBJECT",
              properties: {
                emotion: { type: "STRING" }
              }
            },
          },
          required: ["reactionDelay", "messages"],
        },
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      // API 응답 구조 검증

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0]?.content?.parts?.[0]?.text
      ) {
        const rawResponseText = data.candidates[0].content.parts[0].text;

        try {
          // Clean up the response text to handle potential JSON formatting issues
          let cleanedText = rawResponseText.trim();

          // Remove any potential markdown code blocks
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText
              .replace(/```json\s*/, "")
              .replace(/\s*```$/, "");
          } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText
              .replace(/```[^\n]*\n/, "")
              .replace(/\n?```$/, "");
          }

          // Additional cleanup for common JSON issues
          cleanedText = cleanedText
            .replace(/\\n/g, "\\\\n") // Escape newlines properly for JSON.parse
            .replace(/\\"/g, '\\\\"') // Escape double quotes properly for JSON.parse
            .trim();

          const parsed = JSON.parse(cleanedText);
          parsed.reactionDelay = Math.max(0, parsed.reactionDelay || 0);
          return parsed;
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          console.error("Original text:", rawResponseText);
          console.error("Text length:", rawResponseText.length);

          throw new Error(
            t("api.geminiParsingError", { error: parseError.message }),
          );
        }
      } else {
        // console.warn("API 응답에 유효한 content가 없습니다.", data);
        // console.log("Candidates array:", data.candidates);
        // console.log("Candidates length:", data.candidates?.length);
        if (data.candidates && data.candidates.length > 0) {
          // console.log("First candidate content:", data.candidates[0]?.content);
          // console.log(
          //   "First candidate parts:",
          //   data.candidates[0]?.content?.parts,
          // );
        }

        const reason =
          data.promptFeedback?.blockReason ||
          data.candidates?.[0]?.finishReason ||
          t("api.unknownReason");
        throw new Error(t("api.geminiResponseEmpty", { reason }));
      }
    } catch (error) {
      console.error("Gemini API 호출 중 오류 발생:", error);
      if (error.message.includes("User location is not supported")) {
        return {
          error: t("api.geminiLocationNotSupported"),
        };
      }
      return {
        error: t("api.geminiProcessingError", { error: error.message }),
      };
    }
  }

  /**
   * Generates an AI character profile based on user information.
   * Creates a new character's name and prompt based on the user's name and description.
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
    const { systemPrompt, contents } = buildProfilePrompt({
      userName,
      userDescription,
      profileCreationPrompt,
    });

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: this.profileTemperature,
        maxOutputTokens: this.profileMaxOutputTokens,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            prompt: { type: "STRING" },
          },
          required: ["name", "prompt"],
        },
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Profile Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      // API 응답 구조 검증

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0]?.content?.parts?.[0]?.text
      ) {
        const rawResponseText = data.candidates[0].content.parts[0].text;

        try {
          // Clean up the response text to handle potential JSON formatting issues
          let cleanedText = rawResponseText.trim();

          // Remove any potential markdown code blocks
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText
              .replace(/```json\s*/, "")
              .replace(/\s*```$/, "");
          } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText
              .replace(/```[^\n]*\n/, "")
              .replace(/\n?```$/, "");
          }

          // Additional cleanup for common JSON issues
          cleanedText = cleanedText
            .replace(/\\n/g, "\\\\n") // Escape newlines properly for JSON.parse
            .replace(/\\"/g, '\\\\"') // Escape double quotes properly for JSON.parse
            .trim();

          const parsed = JSON.parse(cleanedText);
          return parsed;
        } catch (parseError) {
          console.error("JSON parsing error for profile:", parseError);
          console.error("Original text:", rawResponseText);
          console.error("Text length:", rawResponseText.length);
          console.error(
            "Character at position 321:",
            rawResponseText.charAt(320),
          );
          console.error(
            "Surrounding text:",
            rawResponseText.substring(310, 330),
          );

          throw new Error(
            t("api.geminiParsingError", { error: parseError.message }),
          );
        }
      } else {
        // console.warn("Profile Gen API 응답에 유효한 content가 없습니다.", data);
        // console.log("Candidates array:", data.candidates);
        // console.log("Candidates length:", data.candidates?.length);
        if (data.candidates && data.candidates.length > 0) {
          // console.log("First candidate content:", data.candidates[0]?.content);
          // console.log(
          //   "First candidate parts:",
          //   data.candidates[0]?.content?.parts,
          // );
        }

        const reason =
          data.promptFeedback?.blockReason ||
          data.candidates?.[0]?.finishReason ||
          t("api.unknownReason");
        throw new Error(t("api.profileNotGenerated", { reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "Gemini" }),
        error,
      );
      return { error: error.message };
    }
  }

  /**
   * Generates a character sheet using Gemini API.
   * @param {object} params - Generation parameters
   * @param {string} params.characterName - Character name
   * @param {string} params.characterDescription - Character description
   * @param {string} params.characterSheetPrompt - Template for character sheet generation
   * @returns {Promise<Object>} Promise resolving to character sheet text response
   * @returns {Array} [returns.messages] - Array of response messages
   * @returns {string} [returns.error] - Error message if error occurs
   * @throws {Error} When API call fails or response processing error occurs
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

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: this.profileTemperature, // Use profile temperature for consistency
        maxOutputTokens: this.profileMaxOutputTokens,
        topP: 0.95,
        responseMimeType: "text/plain", // Character sheet should be plain text markdown
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Character Sheet Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      // API 응답 구조 검증
      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0]?.content?.parts?.[0]?.text
      ) {
        const responseText = data.candidates[0].content.parts[0].text.trim();

        // Return in the same format as generateContent for consistency
        return {
          messages: [{ content: responseText }],
          reactionDelay: 1000, // Standard delay
        };
      } else {
        // console.warn("Character Sheet Gen API 응답에 유효한 content가 없습니다.", data);
        const reason =
          data.promptFeedback?.blockReason ||
          data.candidates?.[0]?.finishReason ||
          t("api.unknownReason");
        throw new Error(t("api.profileNotGenerated", { reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "Gemini" }) + " (Character Sheet)",
        error,
      );
      return { error: error.message };
    }
  }
}
