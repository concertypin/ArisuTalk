import {
  buildContentPrompt,
  buildProfilePrompt,
  buildCharacterSheetPrompt,
} from "../../prompts/builder/promptBuilder.js";
import { t } from "../../i18n.js";

const API_BASE_URL = "https://openrouter.ai/api/v1";

export class OpenRouterClient {
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
    chatId = null,
  }) {
    // Determine chat type from chatId
    const isGroupChat =
      chatId && typeof chatId === "string" && chatId.startsWith("group_");
    const isOpenChat =
      chatId && typeof chatId === "string" && chatId.startsWith("open_");

    const { systemPrompt, contents } = await buildContentPrompt({
      userName,
      userDescription,
      character,
      history,
      prompts,
      isProactive,
      forceSummary,
      isGroupChat,
      isOpenChat,
    });

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    for (const msg of contents) {
      messages.push({ role: msg.role, content: msg.parts[0].text });
    }

    const requestBody = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: messages,
      response_format: { type: "json_object" },
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://github.com/dkfk5326/ArisuTalk",
          "X-Title": "ArisuTalk",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          t("api.apiError", {
            provider: "OpenRouter",
            status: response.status,
            error: errorData.error.message,
          }),
        );
      }

      const data = await response.json();

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
          return {
            reactionDelay: 1000,
            messages: [{ delay: 1000, content: textContent }],
          };
        }
      }

      throw new Error(t("api.invalidResponse", { provider: "OpenRouter" }));
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      return { error: error.message };
    }
  }

  async generateProfile({ userName, userDescription, profileCreationPrompt }) {
    const { systemPrompt, contents } = await buildProfilePrompt({
      userName,
      userDescription,
      profileCreationPrompt,
    });

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    for (const msg of contents) {
      messages.push({ role: msg.role, content: msg.parts[0].text });
    }

    const requestBody = {
      model: this.model,
      max_tokens: this.profileMaxTokens,
      temperature: this.profileTemperature,
      messages: messages,
      response_format: { type: "json_object" },
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://github.com/dkfk5326/ArisuTalk",
          "X-Title": "ArisuTalk",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenRouter Profile Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      if (data.choices && data.choices.length > 0) {
        const textContent = data.choices[0].message.content;
        try {
          return JSON.parse(textContent);
        } catch (parseError) {
          console.error("Profile JSON 파싱 오류:", parseError);
          throw new Error(t("api.profileParseError"));
        }
      } else {
        const reason = data.choices[0].finish_reason || t("api.unknownReason");
        console.warn(
          "OpenRouter Profile Gen API 응답에 유효한 content가 없습니다.",
          data,
        );
        throw new Error(t("api.profileNotGenerated", { reason: reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "OpenRouter" }),
        error,
      );
      return { error: error.message };
    }
  }

  async generateCharacterSheet({
    characterName,
    characterDescription,
    characterSheetPrompt,
  }) {
    const { systemPrompt, contents } = await buildCharacterSheetPrompt({
      characterName,
      characterDescription,
      characterSheetPrompt,
    });

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    for (const msg of contents) {
      messages.push({ role: msg.role, content: msg.parts[0].text });
    }

    const payload = {
      model: this.model,
      max_tokens: this.profileMaxOutputTokens,
      temperature: this.profileTemperature,
      messages: messages,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://github.com/dkfk5326/ArisuTalk",
          "X-Title": "ArisuTalk",
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

      if (data.choices && data.choices.length > 0) {
        const responseText = data.choices[0].message.content.trim();
        return {
          messages: [{ content: responseText }],
          reactionDelay: 1000,
        };
      } else {
        throw new Error(
          t("api.profileNotGenerated", {
            reason: data.choices[0].finish_reason || t("api.unknownReason"),
          }),
        );
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "OpenRouter" }) +
          " (Character Sheet)",
        error,
      );
      return { error: error.message };
    }
  }
}
