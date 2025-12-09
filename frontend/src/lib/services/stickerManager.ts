import { NovelAIClient, validateNAIApiKey } from "$lib/api/novelai";
import { DEFAULT_EMOTIONS, type Emotion } from "$root/defaults";
import type { Character, Sticker } from "$root/types/character";
import { characters } from "$stores/character";
import { settings } from "$stores/settings";
import { get } from "svelte/store";

export interface EmotionObject {
    emotion: string;
    title?: string;
    action?: string;
}

export type EmotionType = string | EmotionObject;

interface NaiDelays {
    minDelay: number;
    maxAdditionalDelay: number;
    rateLimitDelay: number;
    serverErrorDelay: number;
}

interface GenerationResult {
    success: boolean;
    sticker?: Sticker;
    emotion?: string;
    error?: string;
}

export interface StickerProgress {
    type: "sticker" | "character";
    current?: number;
    total?: number;
    emotion?: string;
    character?: string;
    status: "generating" | "completed" | "error" | "processing";
    sticker?: Sticker;
    error?: string;
}

interface GenerationSummary {
    success: boolean;
    generated?: Sticker[];
    failed?: GenerationResult[];
    total?: number;
    message?: string;
    results?: any[];
    summary?: any;
}

/**
 * 스티커 자동 생성 관리자
 * NAI를 활용한 캐릭터별 감정 스티커 자동 생성 및 관리
 */
export class StickerManager {
    public naiClient: NovelAIClient | null;
    private generationQueue: any[];
    private isGenerating: boolean;
    private isCancelled: boolean;
    private NAI_DELAYS: NaiDelays;

    constructor() {
        this.naiClient = null;
        this.generationQueue = [];
        this.isGenerating = false;
        this.isCancelled = false;
        this.NAI_DELAYS = {
            minDelay: 10000,
            maxAdditionalDelay: 5000,
            rateLimitDelay: 15000,
            serverErrorDelay: 5000,
        };
    }

    /**
     * NAI 클라이언트 초기화
     */
    initializeNAI(): boolean {
        const naiSettings = get(settings).apiConfigs.novelai;
        if (!naiSettings || !validateNAIApiKey(naiSettings.apiKey)) {
            return false;
        }

        const DEFAULT_NAI_DELAYS = {
            minDelay: 10000,
            maxAdditionalDelay: 5000,
            rateLimitDelay: 15000,
            serverErrorDelay: 5000,
        };

        this.naiClient = new NovelAIClient(naiSettings.apiKey, {
            minDelay: DEFAULT_NAI_DELAYS.minDelay,
            maxAdditionalDelay: DEFAULT_NAI_DELAYS.maxAdditionalDelay,
        });

        this.NAI_DELAYS = DEFAULT_NAI_DELAYS;

        return true;
    }

    /**
     * 캐릭터가 특정 감정의 스티커를 가지고 있는지 확인
     */
    hasEmotionSticker(character: Character, emotion: EmotionType): boolean {
        if (!character.stickers || !Array.isArray(character.stickers)) {
            return false;
        }

        let emotionKey: string;
        if (typeof emotion === "object" && emotion.emotion) {
            emotionKey = emotion.emotion;
        } else if (typeof emotion === "string") {
            emotionKey = emotion;
        } else {
            return false;
        }

        return character.stickers.some(
            (sticker) =>
                sticker.emotion === emotionKey ||
                sticker.name.toLowerCase().includes(emotionKey.toLowerCase()),
        );
    }

    /**
     * 캐릭터에게 없는 감정 스티커 목록 반환
     */
    getMissingEmotions(
        character: Character,
        emotionList: EmotionType[] = DEFAULT_EMOTIONS,
    ): EmotionType[] {
        return emotionList.filter(
            (emotion) => !this.hasEmotionSticker(character, emotion),
        );
    }

    /**
     * 대화에서 감정 분석
     */
    analyzeEmotion(messageContent: string): string | null {
        if (!messageContent || typeof messageContent !== "string") {
            return null;
        }

        const content = messageContent.toLowerCase();

        const emotionKeywords: Record<string, string[]> = {
            happy: [
                "기쁘",
                "행복",
                "즐거",
                "좋아",
                "웃음",
                "하하",
                "히히",
                "😊",
                "😄",
                "😂",
                "기분 좋",
            ],
            sad: [
                "슬프",
                "우울",
                "눈물",
                "울고",
                "속상",
                "😢",
                "😭",
                "😞",
                "힘들어",
                "아프",
            ],
            angry: [
                "화나",
                "짜증",
                "분노",
                "열받",
                "빡쳐",
                "😠",
                "😡",
                "😤",
                "싫어",
            ],
            surprised: [
                "놀라",
                "깜짝",
                "어?",
                "헉",
                "와",
                "오",
                "😲",
                "😮",
                "😯",
            ],
            love: [
                "사랑",
                "좋아해",
                "♥",
                "💕",
                "💖",
                "💘",
                "애정",
                "마음",
                "설레",
            ],
            embarrassed: ["부끄러", "민망", "😳", "😊", "얼굴 빨개", "쑥스러"],
            confused: ["헷갈려", "모르겠", "어리둥절", "😕", "😐", "🤔"],
            sleepy: ["졸려", "잠와", "피곤", "😴", "💤", "하품"],
            excited: ["신나", "두근두근", "기대", "흥분", "와우", "😆", "🤩"],
        };

        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            if (keywords.some((keyword) => content.includes(keyword))) {
                return emotion;
            }
        }

        return null;
    }

    /**
     * SNS 포스트에서 감정 분석
     */
    analyzePostEmotion(postContent: string): string | null {
        return this.analyzeEmotion(postContent);
    }

    /**
     * 자동 스티커 생성이 필요한지 확인
     */
    shouldGenerateSticker(character: Character, emotion: EmotionType): boolean {
        // Character has naiSettings now
        const characterNaiSettings = character.naiSettings;
        const globalNaiSettings = get(settings).naiSettings;

        const autoGenerate =
            characterNaiSettings?.autoGenerate ??
            globalNaiSettings?.autoGenerate;

        if (!autoGenerate) {
            return false;
        }

        if (this.hasEmotionSticker(character, emotion)) {
            return false;
        }

        if (!this.naiClient) {
            return false;
        }

        return true;
    }

    /**
     * 캐릭터의 스티커를 자동 생성 (대화 중 감정 감지 시)
     */
    async autoGenerateSticker(
        character: Character,
        emotion: string,
    ): Promise<Sticker | null> {
        if (!this.shouldGenerateSticker(character, emotion)) {
            return null;
        }

        if (!this.naiClient) return null;

        try {
            const sticker = await this.naiClient.generateSticker(
                character,
                emotion,
                {
                    naiSettings: get(settings).naiSettings || {},
                },
            );

            if (!character.stickers) {
                character.stickers = [];
            }

            character.stickers.push(sticker);

            characters.update((chars) =>
                chars.map((c) => (c.id === character.id ? character : c)),
            );

            return sticker;
        } catch (error) {
            console.error(`[StickerManager] 자동 스티커 생성 실패:`, error);
            return null;
        }
    }

    /**
     * 스티커 생성 취소
     */
    cancelGeneration() {
        this.isCancelled = true;
    }

    /**
     * 캐릭터의 NAI 일괄 생성 목록 스티커 일괄 생성
     */
    async generateBasicStickerSet(
        character: Character,
        options: {
            emotions?: EmotionType[];
            onProgress?: (data: StickerProgress) => void;
        } = {},
    ): Promise<GenerationSummary> {
        this.isCancelled = false;
        if (!this.initializeNAI()) {
            throw new Error("NAI API 키가 설정되지 않았습니다.");
        }

        const { emotions = DEFAULT_EMOTIONS, onProgress } = options;
        const missingEmotions = this.getMissingEmotions(character, emotions);

        if (missingEmotions.length === 0) {
            return {
                success: true,
                message: "이미 모든 감정의 스티커가 존재합니다.",
                generated: [],
            };
        }

        if (!this.naiClient) throw new Error("NAI Client not initialized");

        try {
            const results: GenerationResult[] = [];

            for (let i = 0; i < missingEmotions.length; i++) {
                if (this.isCancelled) {
                    break;
                }

                const emotion = missingEmotions[i];
                const emotionName =
                    typeof emotion === "string" ? emotion : emotion.emotion;

                try {
                    if (onProgress) {
                        onProgress({
                            type: "sticker",
                            current: i + 1,
                            total: missingEmotions.length,
                            emotion: emotionName,
                            status: "generating",
                        });
                    }

                    const sticker = await this.naiClient.generateSticker(
                        character,
                        emotion,
                        {
                            size:
                                get(settings).naiSettings?.preferredSize ||
                                "square",
                            naiSettings: get(settings).naiSettings || {},
                        },
                    );

                    if (!character.stickers) {
                        character.stickers = [];
                    }
                    character.stickers.push(sticker);

                    characters.update((chars) =>
                        chars.map((c) =>
                            c.id === character.id ? character : c,
                        ),
                    );

                    results.push({
                        success: true,
                        sticker,
                        emotion: emotionName,
                    });

                    if (onProgress) {
                        onProgress({
                            type: "sticker",
                            current: i + 1,
                            total: missingEmotions.length,
                            emotion: emotionName,
                            status: "completed",
                            sticker,
                        });
                    }
                } catch (error: any) {
                    console.error(
                        `[StickerManager] ${emotionName} 스티커 생성 실패:`,
                        error,
                    );

                    if (
                        error.message.includes("429") ||
                        error.message.includes("Too Many Requests")
                    ) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, this.NAI_DELAYS.rateLimitDelay),
                        );
                    } else if (
                        error.message.includes("500") ||
                        error.message.includes("Internal Server Error")
                    ) {
                        await new Promise((resolve) =>
                            setTimeout(
                                resolve,
                                this.NAI_DELAYS.serverErrorDelay,
                            ),
                        );
                    }

                    results.push({
                        success: false,
                        error: error.message,
                        emotion: emotionName,
                    });

                    if (onProgress) {
                        onProgress({
                            type: "sticker",
                            current: i + 1,
                            total: missingEmotions.length,
                            emotion: emotionName,
                            status: "error",
                            error: error.message,
                        });
                    }
                }
            }

            const generatedStickers = results
                .filter((result) => result.success)
                .map((result) => result.sticker as Sticker);

            return {
                success: true,
                generated: generatedStickers,
                failed: results.filter((result) => !result.success),
                total: missingEmotions.length,
            };
        } catch (error) {
            console.error(
                `[StickerManager] 기본 스티커 세트 생성 실패:`,
                error,
            );
            throw error;
        }
    }

    /**
     * 모든 캐릭터의 기본 스티커 일괄 생성
     */
    async generateStickersForAllCharacters(
        options: {
            emotions?: EmotionType[];
            onProgress?: (data: StickerProgress) => void;
        } = {},
    ): Promise<GenerationSummary> {
        if (!this.initializeNAI()) {
            throw new Error("NAI API 키가 설정되지 않았습니다.");
        }

        const allCharacters = get(characters);
        const results: any[] = [];
        const { onProgress, emotions = DEFAULT_EMOTIONS } = options;

        let totalProcessed = 0;
        const totalCharacters = allCharacters.length;

        for (const character of allCharacters) {
            try {
                if (onProgress) {
                    onProgress({
                        type: "character",
                        current: totalProcessed + 1,
                        total: totalCharacters,
                        character: character.name,
                        status: "processing",
                    });
                }

                const result = await this.generateBasicStickerSet(character, {
                    emotions,
                    onProgress: (stickerProgress) => {
                        if (onProgress) {
                            onProgress({
                                character: character.name,
                                ...stickerProgress,
                            });
                        }
                    },
                });

                results.push({
                    character: character.name,
                    success: true,
                    result,
                });
            } catch (error: any) {
                results.push({
                    character: character.name,
                    success: false,
                    error: error.message,
                });
            }

            totalProcessed++;
        }

        return {
            success: true,
            results,
            summary: {
                totalCharacters: totalCharacters,
                successCount: results.filter((r) => r.success).length,
                failCount: results.filter((r) => !r.success).length,
            },
        };
    }

    /**
     * 캐릭터의 NAI 설정 업데이트
     */
    updateCharacterNAISettings(
        character: Character,
        naiSettings: Record<string, any>,
    ): void {
        if (!character.naiSettings) {
            character.naiSettings = {};
        }

        Object.assign(character.naiSettings, {
            autoGenerate: naiSettings.autoGenerate !== false,
            preferredSize: naiSettings.preferredSize || "square",
            lastGenerated: naiSettings.lastGenerated || null,
            generatedEmotions: naiSettings.generatedEmotions || [],
            vibeImage: naiSettings.vibeImage || null,
            ...naiSettings,
        });
    }

    /**
     * NAI 생성 통계 정보 반환
     */
    getGenerationStats(): any {
        const allCharacters = get(characters);
        let totalGenerated = 0;
        let charactersWithGenerated = 0;

        allCharacters.forEach((character) => {
            if (character.stickers) {
                const generatedStickers = character.stickers.filter(
                    (s: any) => s.generated,
                );
                totalGenerated += generatedStickers.length;
                if (generatedStickers.length > 0) {
                    charactersWithGenerated++;
                }
            }
        });

        return {
            totalCharacters: allCharacters.length,
            charactersWithGenerated,
            totalGeneratedStickers: totalGenerated,
            averageStickersPerCharacter:
                totalGenerated / Math.max(charactersWithGenerated, 1),
        };
    }
}

/**
 * 감정 분석 유틸리티 함수들
 */
export const EmotionAnalyzer = {
    /**
     * 메시지에서 감정 강도 분석
     */
    analyzeEmotionIntensity(content: string): Record<string, number> {
        if (!content || typeof content !== "string") {
            return {};
        }

        const emotions: Record<string, number> = {
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            love: 0,
            embarrassed: 0,
            confused: 0,
            sleepy: 0,
            excited: 0,
        };

        const indicators: Record<
            string,
            { keywords: string[]; emojis: string[]; weight: number }
        > = {
            happy: {
                keywords: ["하하", "히히", "크크", "웃음"],
                emojis: ["😊", "😄", "😂", "😆"],
                weight: 1,
            },
            sad: {
                keywords: ["흑흑", "엉엉", "슬퍼"],
                emojis: ["😢", "😭", "😞"],
                weight: 1,
            },
            angry: {
                keywords: ["흥", "아우", "젠장"],
                emojis: ["😠", "😡", "😤"],
                weight: 1,
            },
            surprised: {
                keywords: ["어?", "헉", "와"],
                emojis: ["😲", "😮", "😯"],
                weight: 1,
            },
            love: {
                keywords: ["하트", "좋아"],
                emojis: ["💕", "💖", "💘"],
                weight: 1,
            },
            embarrassed: {
                keywords: ["쑥스", "부끄"],
                emojis: ["😳", "😊"],
                weight: 1,
            },
        };

        Object.entries(indicators).forEach(([emotion, data]) => {
            data.keywords.forEach((keyword) => {
                if (content.includes(keyword)) {
                    emotions[emotion] += data.weight;
                }
            });

            data.emojis.forEach((emoji) => {
                if (content.includes(emoji)) {
                    emotions[emotion] += data.weight;
                }
            });
        });

        return emotions;
    },

    /**
     * 가장 강한 감정 반환
     */
    getDominantEmotion(emotionScores: Record<string, number>): string | null {
        let maxScore = 0;
        let dominantEmotion: string | null = null;

        Object.entries(emotionScores).forEach(([emotion, score]) => {
            if (score > maxScore) {
                maxScore = score;
                dominantEmotion = emotion;
            }
        });

        return maxScore > 0 ? dominantEmotion : null;
    },
};
