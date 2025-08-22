import { buildContentPrompt, buildProfilePrompt } from './promptBuilder.js';
import '../types.js';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiClient {
    /**
     * @param {string} apiKey 
     * @param {string} model 
     */
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    /**
     * @param {object} arg0
     * @param {string} arg0.userName
     * @param {string} arg0.userDescription
     * @param {import('../types.js').Character} arg0.character
     * @param {import('../types.js').Message[]} arg0.history
     * @param {import('../types.js').Prompts} arg0.prompts
     * @param {boolean} [arg0.isProactive]
     * @param {boolean} [arg0.forceSummary]
     * @returns {Promise<any>} todo
     */
    async generateContent({ userName, userDescription, character, history, prompts, isProactive = false, forceSummary = false }) {
        const { contents, systemPrompt } = buildContentPrompt({
            userName,
            userDescription,
            character,
            history,
            prompts,
            isProactive,
            forceSummary
        });

        const payload = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                temperature: 1.25,
                topK: 40,
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "reactionDelay": { "type": "INTEGER" },
                        "messages": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "delay": { "type": "INTEGER" },
                                    "content": { "type": "STRING" },
                                    "sticker": { "type": "STRING" }
                                },
                                required: ["delay"]
                            }
                        },
                        "newMemory": { "type": "STRING" }
                    },
                    required: ["reactionDelay", "messages"]
                }
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("API Error:", data);
                const errorMessage = data?.error?.message || `API 요청 실패: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts[0]?.text) {
                const rawResponseText = data.candidates[0].content.parts[0].text;
                const parsed = JSON.parse(rawResponseText);
                parsed.reactionDelay = Math.max(0, parsed.reactionDelay || 0);
                return parsed;
            } else {
                const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || '알 수 없는 이유';
                console.warn("API 응답에 유효한 content가 없습니다.", data);
                throw new Error(`답변이 생성되지 않았습니다. (이유: ${reason})`);
            }

        } catch (error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (error.message.includes("User location is not supported")) {
                return { error: `죄송합니다. 현재 계신 국가에서는 Gemini API 사용이 지원되지 않습니다.` };
            }
            return { error: `응답 처리 중 오류가 발생했습니다: ${error.message}` };
        }
    }

    /**
     * @param {{userName: string, userDescription: string, profileCreationPrompt: string}} arg0
     * @returns {Promise<any>} todo
     */
    async generateProfile({ userName, userDescription, profileCreationPrompt }) {
        const { systemPrompt, contents } = buildProfilePrompt({ userName, userDescription, profileCreationPrompt });

        const payload = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                temperature: 1.2,
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "name": { "type": "STRING" },
                        "prompt": { "type": "STRING" }
                    },
                    required: ["name", "prompt"]
                }
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Profile Gen API Error:", data);
                const errorMessage = data?.error?.message || `API 요청 실패: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts[0]?.text) {
                return JSON.parse(data.candidates[0].content.parts[0].text);
            } else {
                const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || '알 수 없는 이유';
                console.warn("Profile Gen API 응답에 유효한 content가 없습니다.", data);
                throw new Error(`프로필이 생성되지 않았습니다. (이유: ${reason})`);
            }
        } catch (error) {
            console.error("프로필 생성 API 호출 중 오류 발생:", error);
            return { error: error.message };
        }
    }
}