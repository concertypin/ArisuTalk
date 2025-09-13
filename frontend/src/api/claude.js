import {
  buildContentPrompt,
  buildProfilePrompt,
  buildCharacterSheetPrompt,
} from "../prompts/builder/promptBuilder.js";
import { t } from "../i18n.js";

const API_BASE_URL = "https://api.anthropic.com/v1";

export class ClaudeClient {
  constructor(apiKey, model, baseUrl = API_BASE_URL, options = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.8;
    this.profileMaxTokens = options.profileMaxTokens || 1024;
    this.profileTemperature = options.profileTemperature || 1.2;
  }

  async generateContent({
    userName,
    userDescription,
    character,
    history,
    prompts,
    isProactive = false,
    forceSummary = false,
  }) {
    const { systemPrompt } = await buildContentPrompt({
      userName,
      userDescription,
      character,
      history,
      prompts,
      isProactive,
      forceSummary,
    });

    const messages = [];
    for (const msg of history) {
      const role = msg.isMe ? "user" : "assistant";
      let content = msg.content || "";

      if (msg.isMe && msg.type === "image" && msg.imageId) {
        const imageData = character?.media?.find((m) => m.id === msg.imageId);
        if (imageData) {
          content = [
            { type: "text", text: content || t("api.imageMessage") },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageData.mimeType || "image/jpeg",
                data: imageData.dataUrl.split(",")[1],
              },
            },
          ];
        } else {
          content = content || t("api.imageUnavailable");
        }
      } else if (msg.isMe && msg.type === "sticker" && msg.stickerData) {
        const stickerName =
          msg.stickerData.stickerName || t("api.unknownSticker");
        content = `${t("api.stickerMessage", { stickerName: stickerName })}${
          content ? ` ${content}` : ""
        }`;
      }

      if (content) {
        messages.push({ role, content });
      }
    }

    if (isProactive && messages.length === 0) {
      messages.push({
        role: "user",
        content: "(SYSTEM: You are starting this conversation. Please begin.)",
      });
    }

    const requestBody = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: messages,
    };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          t("api.apiError", {
            provider: "Claude",
            status: response.status,
            error: errorData,
          }),
        );
      }

      const data = await response.json();

      if (data.content && data.content.length > 0) {
        const textContent = data.content[0].text;

        try {
          const parsedResponse = JSON.parse(textContent);
          if (
            parsedResponse.messages &&
            Array.isArray(parsedResponse.messages)
          ) {
            // autoPost, characterState, newMemory 등 모든 필드 포함
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

      throw new Error(t("api.invalidResponse", { provider: "Claude" }));
    } catch (error) {
      console.error("Claude API Error:", error);
      return { error: error.message };
    }
  }

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
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `${t("api.userNameLabel")} ${userName}\n${t(
            "api.userDescriptionLabel",
          )} ${userDescription}`,
        },
      ],
    };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Claude Profile Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      if (data.content && data.content.length > 0 && data.content[0].text) {
        try {
          return JSON.parse(data.content[0].text);
        } catch (parseError) {
          console.error("Profile JSON 파싱 오류:", parseError);
          throw new Error(t("api.profileParseError"));
        }
      } else {
        const reason = data.stop_reason || t("api.unknownReason");
        // console.warn(
        //   "Claude Profile Gen API 응답에 유효한 content가 없습니다.",
        //   data,
        // );
        throw new Error(t("api.profileNotGenerated", { reason: reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "Claude" }),
        error,
      );
      return { error: error.message };
    }
  }

  /**
   * Generates a character sheet using Claude API.
   * @param {object} params - Generation parameters
   * @param {string} params.characterName - Character name
   * @param {string} params.characterDescription - Character description
   * @param {string} params.characterSheetPrompt - Template for character sheet generation
   * @returns {Promise<Object>} Promise resolving to character sheet text response
   */
  async generateCharacterSheet({
    characterName,
    characterDescription,
    characterSheetPrompt,
  }) {
    const { systemPrompt, contents } = buildCharacterSheetPrompt({
      characterName,
      characterDescription,
      characterSheetPrompt,
    });

    const payload = {
      model: this.model,
      max_tokens: this.profileMaxOutputTokens,
      temperature: this.profileTemperature,
      system: systemPrompt,
      messages: contents.map((content) => ({
        role: content.role === "model" ? "assistant" : content.role,
        content: content.parts.map((part) => part.text).join(""),
      })),
    };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Character Sheet Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      if (data.content && data.content.length > 0) {
        const responseText = data.content
          .map((item) => item.text)
          .join("")
          .trim();

        return {
          messages: [{ content: responseText }],
          reactionDelay: 1000,
        };
      } else {
        throw new Error(
          t("api.profileNotGenerated", {
            reason: data.stop_reason || t("api.unknownReason"),
          }),
        );
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "Claude" }) +
          " (Character Sheet)",
        error,
      );
      return { error: error.message };
    }
  }
}
