import { buildContentPrompt, buildProfilePrompt, buildCharacterSheetPrompt } from "../prompts/builder/promptBuilder.js";
import { t } from "../i18n.js";

const API_BASE_URL = "https://api.x.ai/v1";

export class GrokClient {
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

    // for_update 라인 7113-7118: 요청 본문 구성
    const requestBody = {
      model: this.model,
      messages: messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    try {
      // for_update 라인 7121-7128: API 호출
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
            provider: "Grok",
            status: response.status,
            error: errorData,
          }),
        );
      }

      const data = await response.json();

      // for_update 라인 7137-7152: 응답 처리
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

      throw new Error(t("api.invalidResponse", { provider: "Grok" }));
    } catch (error) {
      console.error("Grok API Error:", error);
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
        console.error("Grok Profile Gen API Error:", data);
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
        // console.warn(
        //   "Grok Profile Gen API 응답에 유효한 content가 없습니다.",
        //   data,
        // );
        throw new Error(t("api.profileNotGenerated", { reason: reason }));
      }
    } catch (error) {
      console.error(
        t("api.profileGenerationError", { provider: "Grok" }),
        error,
      );
      return { error: error.message };
    }
  }

  /**
   * Generates a character sheet using Grok API.
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
        t("api.profileGenerationError", { provider: "Grok" }) + " (Character Sheet)",
        error,
      );
      return { error: error.message };
    }
  }
}
