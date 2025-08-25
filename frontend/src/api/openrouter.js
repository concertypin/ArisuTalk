import { buildContentPrompt, buildProfilePrompt } from './promptBuilder.js';

const API_BASE_URL = 'https://openrouter.ai/api/v1';

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

    async generateContent({ userName, userDescription, character, history, prompts, isProactive = false, forceSummary = false }) {
        const { systemPrompt } = buildContentPrompt({
            userName,
            userDescription,
            character,
            history,
            prompts,
            isProactive,
            forceSummary
        });

        // for_update 라인 7164-7194: 히스토리를 OpenRouter(OpenAI 호환) 형식으로 변환
        const messages = [];
        for (const msg of history) {
            const role = msg.isMe ? "user" : "assistant";
            let content = msg.content || "";
            
            if (msg.isMe && msg.type === 'image' && msg.imageId) {
                const imageData = character?.media?.find(m => m.id === msg.imageId);
                if (imageData) {
                    content = [
                        { type: "text", text: content || "이미지를 보냈습니다." },
                        { 
                            type: "image_url", 
                            image_url: {
                                url: imageData.dataUrl
                            }
                        }
                    ];
                } else {
                    content = content || "(사용자가 이미지를 보냈지만 더 이상 사용할 수 없습니다)";
                }
            } else if (msg.isMe && msg.type === 'sticker' && msg.stickerData) {
                const stickerName = msg.stickerData.stickerName || 'Unknown Sticker';
                content = `[사용자가 "${stickerName}" 스티커를 보냄]${content ? ` ${content}` : ''}`;
            }
            
            if (content) {
                messages.push({ role, content });
            }
        }
        
        // for_update 라인 7196-7201: Proactive 모드 처리
        if (isProactive && messages.length === 0) {
            messages.push({
                role: "user",
                content: "(SYSTEM: You are starting this conversation. Please begin.)"
            });
        }
        
        // for_update 라인 7207: 시스템 메시지 추가
        messages.unshift({ role: "system", content: systemPrompt });
        
        // for_update 라인 7209-7214: 요청 본문 구성
        const requestBody = {
            model: this.model,
            messages: messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        };
        
        try {
            // for_update 라인 7217-7226: API 호출
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'ArisuTalk'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`OpenRouter API 오류: ${response.status} - ${errorData}`);
            }
            
            const data = await response.json();
            
            // for_update 라인 7235-7250: 응답 처리
            if (data.choices && data.choices.length > 0) {
                const textContent = data.choices[0].message.content;
                
                try {
                    const parsedResponse = JSON.parse(textContent);
                    if (parsedResponse.messages && Array.isArray(parsedResponse.messages)) {
                        return parsedResponse;
                    }
                } catch (e) {
                    // JSON 파싱 실패시 텍스트를 단일 메시지로 처리
                    return {
                        reactionDelay: 1000,
                        messages: [{ delay: 1000, content: textContent }]
                    };
                }
            }
            
            throw new Error('OpenRouter API로부터 유효한 응답을 받지 못했습니다.');
            
        } catch (error) {
            console.error('OpenRouter API Error:', error);
            return { error: error.message };
        }
    }

    async generateProfile({ userName, userDescription, profileCreationPrompt }) {
        const { systemPrompt } = buildProfilePrompt({ userName, userDescription, profileCreationPrompt });

        const requestBody = {
            model: this.model,
            max_tokens: this.profileMaxTokens,
            temperature: this.profileTemperature,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `사용자 이름: ${userName}\n사용자 설명: ${userDescription}`
                }
            ]
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'ArisuTalk'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("OpenRouter Profile Gen API Error:", data);
                const errorMessage = data?.error?.message || `API 요청 실패: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
                try {
                    return JSON.parse(data.choices[0].message.content);
                } catch (parseError) {
                    console.error("Profile JSON 파싱 오류:", parseError);
                    throw new Error("프로필 응답을 JSON으로 파싱할 수 없습니다.");
                }
            } else {
                const reason = data.choices?.[0]?.finish_reason || '알 수 없는 이유';
                console.warn("OpenRouter Profile Gen API 응답에 유효한 content가 없습니다.", data);
                throw new Error(`프로필이 생성되지 않았습니다. (이유: ${reason})`);
            }
        } catch (error) {
            console.error("OpenRouter 프로필 생성 API 호출 중 오류 발생:", error);
            return { error: error.message };
        }
    }
}