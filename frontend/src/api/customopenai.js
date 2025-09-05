import { buildContentPrompt, buildProfilePrompt, buildCharacterSheetPrompt } from "../prompts/builder/promptBuilder.js";
import { t } from "../i18n.js";

export class CustomOpenAIClient {
  /**
   * @param {string} apiKey - OpenAI API key
   * @param {string} model - Model name to use
   * @param {string} baseUrl - Base URL for the API
   * @param {Object} options - Configuration options
   * @param {number} options.maxTokens - Max tokens for content generation
   * @param {number} options.temperature - Temperature for content generation
   * @param {number} options.profileMaxTokens - Max tokens for profile generation
   * @param {number} options.profileTemperature - Temperature for profile generation
   */
  constructor(
    apiKey,
    model,
    baseUrl = "https://api.openai.com/v1",
    options = {},
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.8;
    this.profileMaxTokens = options.profileMaxTokens || 1024;
    this.profileTemperature = options.profileTemperature || 1.2;
  }

  /**
   * Generate content using the OpenAI API
   * @param {Object} params - Generation parameters
   * @param {string} params.userName - User name
   * @param {string} params.userDescription - User description
   * @param {Object} params.character - Character object
   * @param {Array} params.history - Message history
   * @param {Object} params.prompts - Prompt configuration
   * @param {boolean} params.isProactive - Whether this is a proactive message
   * @param {boolean} params.forceSummary - Whether to force summary
   * @returns {Promise<Object>} Generated content response
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

    const messages = contents.map(c => {
      const contentParts = c.parts.map(p => {
        if (p.inlineData) {
          return {
            type: 'image_url',
            image_url: {
              url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
            },
          };
        }
        return { type: 'text', text: p.text };
      }).filter(p => p.text || p.image_url);

      const finalContent = (contentParts.length === 1 && contentParts[0].type === 'text')
        ? contentParts[0].text
        : contentParts;

      return {
        role: c.role === 'model' ? 'assistant' : c.role,
        content: finalContent,
      };
    });

    messages.unshift({ role: "system", content: systemPrompt });

    // for_update 라인 7310-7315: 요청 본문 구성
    const requestBody = {
      model: this.model,
      messages: messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    try {
      // for_update 라인 7318-7325: API 호출
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
          t("api.customOpenAIError", {
            status: response.status,
            error: errorData,
          }),
        );
      }

      const data = await response.json();

      // for_update 라인 7334-7349: 응답 처리
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

      throw new Error(t("api.invalidResponse"));
    } catch (error) {
      console.error("Custom OpenAI API Error:", error);
      return { error: error.message };
    }
  }

  /**
   * Generate character profile using the OpenAI API
   * @param {Object} params - Profile generation parameters
   * @param {string} params.userName - User name
   * @param {string} params.userDescription - User description
   * @param {string} params.profileCreationPrompt - Profile creation prompt
   * @returns {Promise<Object>} Generated profile response
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
        console.error("Custom OpenAI Profile Gen API Error:", data);
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
          "Custom OpenAI Profile Gen API 응답에 유효한 content가 없습니다.",
          data,
        );
        throw new Error(t("api.profileNotGenerated", { reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "Custom OpenAI" }),
        error,
      );
      return { error: error.message };
    }
  }

  /**
   * Generates a character sheet using Custom OpenAI API.
   */
  async generateCharacterSheet({
    characterName,
    characterDescription,
    characterSheetPrompt
  }) {
    const { systemPrompt, contents } = await buildCharacterSheetPrompt({
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
        t("api.profileGenerationError", { provider: "Custom OpenAI" }) + " (Character Sheet)",
        error,
      );
      return { error: error.message };
    }
  }
}
