import { buildContentPrompt, buildProfilePrompt } from "./promptBuilder.js";
import { t } from "../i18n.js";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiClient {
  constructor(apiKey, model, baseUrl = API_BASE_URL, options = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.maxOutputTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 1.25;
    this.profileMaxOutputTokens = options.profileMaxTokens || 1024;
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
    const { contents, systemPrompt } = buildContentPrompt({
      userName,
      userDescription,
      character,
      history,
      prompts,
      isProactive,
      forceSummary,
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
            newMemory: { type: "STRING" },
            characterState: {
              type: "OBJECT",
              properties: {
                mood: { type: "NUMBER" },
                energy: { type: "NUMBER" },
                socialBattery: { type: "NUMBER" },
                personality: {
                  type: "OBJECT",
                  properties: {
                    extroversion: { type: "NUMBER" },
                    openness: { type: "NUMBER" },
                    conscientiousness: { type: "NUMBER" },
                    agreeableness: { type: "NUMBER" },
                    neuroticism: { type: "NUMBER" },
                  },
                  required: [
                    "extroversion",
                    "openness",
                    "conscientiousness",
                    "agreeableness",
                    "neuroticism",
                  ],
                },
              },
              required: ["mood", "energy", "socialBattery", "personality"],
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
        }
      );

      const data = await response.json();
      console.log("Full API Response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error("API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      // API 응답 구조 검증
      console.log("Candidates exists:", !!data.candidates);
      console.log("Candidates length:", data.candidates?.length);
      console.log("First candidate:", data.candidates?.[0]);

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0]?.content?.parts?.[0]?.text
      ) {
        const rawResponseText = data.candidates[0].content.parts[0].text;
        console.log("Raw response text:", rawResponseText);

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
            .replace(/\\n/g, "\\\\n") // Escape newlines properly
            .replace(/\\'/g, "\\'") // Escape single quotes
            .replace(/\\"/g, '\\\\"') // Escape double quotes properly
            .trim();

          const parsed = JSON.parse(cleanedText);
          parsed.reactionDelay = Math.max(0, parsed.reactionDelay || 0);
          return parsed;
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          console.error("Original text:", rawResponseText);
          console.error("Text length:", rawResponseText.length);

          throw new Error(
            t("api.geminiParsingError", { error: parseError.message })
          );
        }
      } else {
        console.warn("API 응답에 유효한 content가 없습니다.", data);
        console.log("Candidates array:", data.candidates);
        console.log("Candidates length:", data.candidates?.length);
        if (data.candidates && data.candidates.length > 0) {
          console.log("First candidate content:", data.candidates[0]?.content);
          console.log(
            "First candidate parts:",
            data.candidates[0]?.content?.parts
          );
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
        }
      );

      const data = await response.json();
      console.log("Full Profile API Response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error("Profile Gen API Error:", data);
        const errorMessage =
          data?.error?.message ||
          t("api.requestFailed", { status: response.statusText });
        throw new Error(errorMessage);
      }

      // API 응답 구조 검증
      console.log("Candidates exists:", !!data.candidates);
      console.log("Candidates length:", data.candidates?.length);
      console.log("First candidate:", data.candidates?.[0]);

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0]?.content?.parts?.[0]?.text
      ) {
        const rawResponseText = data.candidates[0].content.parts[0].text;
        console.log("Raw profile response:", rawResponseText);

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
            .replace(/\\n/g, "\\\\n") // Escape newlines properly
            .replace(/\\'/g, "\\'") // Escape single quotes
            .replace(/\\"/g, '\\\\"') // Escape double quotes properly
            .trim();

          console.log("Cleaned profile response:", cleanedText);

          const parsed = JSON.parse(cleanedText);
          return parsed;
        } catch (parseError) {
          console.error("JSON parsing error for profile:", parseError);
          console.error("Original text:", rawResponseText);
          console.error("Text length:", rawResponseText.length);
          console.error(
            "Character at position 321:",
            rawResponseText.charAt(320)
          );
          console.error(
            "Surrounding text:",
            rawResponseText.substring(310, 330)
          );

          throw new Error(
            t("api.geminiParsingError", { error: parseError.message })
          );
        }
      } else {
        console.warn("Profile Gen API 응답에 유효한 content가 없습니다.", data);
        console.log("Candidates array:", data.candidates);
        console.log("Candidates length:", data.candidates?.length);
        if (data.candidates && data.candidates.length > 0) {
          console.log("First candidate content:", data.candidates[0]?.content);
          console.log(
            "First candidate parts:",
            data.candidates[0]?.content?.parts
          );
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
        error
      );
      return { error: error.message };
    }
  }
}
