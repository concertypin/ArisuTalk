import { NovelAIClient, DEFAULT_EMOTIONS, validateNAIApiKey } from "../api/novelai.js";
import { saveToBrowserStorage } from "../storage.js";
import { t } from "../i18n.js";

/**
 * 스티커 자동 생성 관리자
 * NAI를 활용한 캐릭터별 감정 스티커 자동 생성 및 관리
 */
export class StickerManager {
  constructor(app) {
    this.app = app;
    this.naiClient = null;
    this.generationQueue = [];
    this.isGenerating = false;
  }

  /**
   * NAI 클라이언트 초기화
   * @returns {boolean} 초기화 성공 여부
   */
  initializeNAI() {
    const naiSettings = this.app.state.settings.naiSettings;
    if (!naiSettings || !validateNAIApiKey(naiSettings.apiKey)) {
      // console.warn("[StickerManager] NAI API 키가 설정되지 않았습니다.");
      return false;
    }

    // 중앙 관리되는 기본 NAI 딜레이 설정 (캐릭터별 설정이 없을 때 사용)
    const DEFAULT_NAI_DELAYS = {
      minDelay: 10000,        // 최소 10초
      maxAdditionalDelay: 5000, // 추가 0~5초
      rateLimitDelay: 15000,   // 429 에러 시 15초
      serverErrorDelay: 5000,  // 500 에러 시 5초
    };

    this.naiClient = new NovelAIClient(naiSettings.apiKey, {
      minDelay: DEFAULT_NAI_DELAYS.minDelay,
      maxAdditionalDelay: DEFAULT_NAI_DELAYS.maxAdditionalDelay,
    });
    
    // 에러 복구 딜레이도 중앙에서 관리
    this.NAI_DELAYS = DEFAULT_NAI_DELAYS;

    return true;
  }

  /**
   * 캐릭터가 특정 감정의 스티커를 가지고 있는지 확인
   * @param {Object} character - 캐릭터 정보
   * @param {string} emotion - 감정
   * @returns {boolean} 스티커 존재 여부
   */
  hasEmotionSticker(character, emotion) {
    if (!character.stickers || !Array.isArray(character.stickers)) {
      return false;
    }

    return character.stickers.some(sticker => 
      sticker.emotion === emotion || 
      sticker.name.toLowerCase().includes(emotion.toLowerCase())
    );
  }

  /**
   * 캐릭터에게 없는 감정 스티커 목록 반환
   * @param {Object} character - 캐릭터 정보
   * @param {string[]} emotionList - 확인할 감정 목록
   * @returns {string[]} 없는 감정 목록
   */
  getMissingEmotions(character, emotionList = DEFAULT_EMOTIONS) {
    return emotionList.filter(emotion => !this.hasEmotionSticker(character, emotion));
  }

  /**
   * 대화에서 감정 분석
   * @param {string} messageContent - 메시지 내용
   * @returns {string|null} 감지된 감정 또는 null
   */
  analyzeEmotion(messageContent) {
    if (!messageContent || typeof messageContent !== 'string') {
      return null;
    }

    const content = messageContent.toLowerCase();
    
    // 간단한 키워드 기반 감정 분석
    const emotionKeywords = {
      happy: ['기쁘', '행복', '즐거', '좋아', '웃음', '하하', '히히', '😊', '😄', '😂', '기분 좋'],
      sad: ['슬프', '우울', '눈물', '울고', '속상', '😢', '😭', '😞', '힘들어', '아프'],
      angry: ['화나', '짜증', '분노', '열받', '빡쳐', '😠', '😡', '😤', '싫어'],
      surprised: ['놀라', '깜짝', '어?', '헉', '와', '오', '😲', '😮', '😯'],
      love: ['사랑', '좋아해', '♥', '💕', '💖', '💘', '애정', '마음', '설레'],
      embarrassed: ['부끄러', '민망', '😳', '😊', '얼굴 빨개', '쑥스러'],
      confused: ['헷갈려', '모르겠', '어리둥절', '😕', '😐', '🤔'],
      sleepy: ['졸려', '잠와', '피곤', '😴', '💤', '하품'],
      excited: ['신나', '두근두근', '기대', '흥분', '와우', '😆', '🤩']
    };

    // 키워드 매칭으로 감정 감지
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return emotion;
      }
    }

    return null;
  }

  /**
   * SNS 포스트에서 감정 분석
   * @param {string} postContent - 포스트 내용
   * @returns {string|null} 감지된 감정 또는 null
   */
  analyzePostEmotion(postContent) {
    return this.analyzeEmotion(postContent);
  }

  /**
   * 자동 스티커 생성이 필요한지 확인
   * @param {Object} character - 캐릭터 정보
   * @param {string} emotion - 감정
   * @returns {boolean} 생성 필요 여부
   */
  shouldGenerateSticker(character, emotion) {
    // 캐릭터별 NAI 설정 확인 (전역 설정이 아닌 캐릭터 설정 우선)
    const characterNaiSettings = character.naiSettings;
    const globalNaiSettings = this.app.state.settings.naiSettings;
    
    // console.log('[StickerManager] shouldGenerateSticker 체크:', {
    //   emotion,
    //   characterName: character.name,
    //   characterAutoGenerate: characterNaiSettings?.autoGenerate,
    //   globalAutoGenerate: globalNaiSettings?.autoGenerate,
    //   hasNaiClient: !!this.naiClient
    // });
    
    // 캐릭터별 자동 생성 설정 확인 (캐릭터 설정이 없으면 전역 설정 사용)
    const autoGenerate = characterNaiSettings?.autoGenerate ?? globalNaiSettings?.autoGenerate;
    
    if (!autoGenerate) {
      // console.log('[StickerManager] 자동 생성이 비활성화되어 있음');
      return false;
    }

    // 해당 감정의 스티커가 이미 있으면 생성하지 않음
    if (this.hasEmotionSticker(character, emotion)) {
      // console.log('[StickerManager] 이미 해당 감정의 스티커가 존재함:', emotion);
      return false;
    }

    // NAI 클라이언트가 없으면 생성할 수 없음
    if (!this.naiClient) {
      // console.log('[StickerManager] NAI 클라이언트가 없음');
      return false;
    }

    return true;
  }

  /**
   * 캐릭터의 스티커를 자동 생성 (대화 중 감정 감지 시)
   * @param {Object} character - 캐릭터 정보
   * @param {string} emotion - 감정
   * @returns {Promise<Object|null>} 생성된 스티커 또는 null
   */
  async autoGenerateSticker(character, emotion) {
    if (!this.shouldGenerateSticker(character, emotion)) {
      return null;
    }

    try {
      const sticker = await this.naiClient.generateSticker(character, emotion, {
        naiSettings: this.app.state.settings.naiSettings || {}
      });
      
      // 캐릭터에 스티커 추가
      if (!character.stickers) {
        character.stickers = [];
      }
      
      // 디버깅: 스티커 데이터 확인
      // console.log('[StickerManager] 생성된 스티커 정보:', {
      //   id: sticker.id,
      //   name: sticker.name,
      //   type: sticker.type,
      //   hasDataUrl: !!sticker.dataUrl,
      //   dataUrlLength: sticker.dataUrl?.length,
      //   dataUrlValid: sticker.dataUrl?.startsWith('data:image/'),
      //   dataUrlPrefix: sticker.dataUrl?.substring(0, 50) + '...'
      // });
      
      character.stickers.push(sticker);
      
      // 캐릭터 정보 즉시 저장
      const updatedCharacters = this.app.state.characters.map(c => 
        c.id === character.id ? character : c
      );
      await saveToBrowserStorage("personaChat_characters_v16", updatedCharacters);
      this.app.state.characters = updatedCharacters;
      
      // UI 업데이트를 위해 상태 갱신
      this.app.setState({ characters: updatedCharacters });
      
      // console.log(`[StickerManager] ${character.name}의 ${emotion} 스티커가 자동 생성되어 저장되었습니다.`);
      return sticker;
    } catch (error) {
      console.error(`[StickerManager] 자동 스티커 생성 실패:`, error);
      return null;
    }
  }

  /**
   * 캐릭터의 NAI 일괄 생성 목록 스티커 일괄 생성
   * @param {Object} character - 캐릭터 정보
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Object>} 생성 결과
   */
  async generateBasicStickerSet(character, options = {}) {
    if (!this.initializeNAI()) {
      throw new Error("NAI API 키가 설정되지 않았습니다.");
    }

    const { emotions = DEFAULT_EMOTIONS, onProgress } = options;
    const missingEmotions = this.getMissingEmotions(character, emotions);
    
    if (missingEmotions.length === 0) {
      return {
        success: true,
        message: "이미 모든 감정의 스티커가 존재합니다.",
        generated: []
      };
    }

    try {
      const results = [];
      
      // 스티커를 하나씩 생성하고 즉시 저장
      for (let i = 0; i < missingEmotions.length; i++) {
        const emotion = missingEmotions[i];
        
        try {
          if (onProgress) {
            onProgress({
              type: "sticker",
              current: i + 1,
              total: missingEmotions.length,
              emotion,
              status: "generating"
            });
          }

          const sticker = await this.naiClient.generateSticker(character, emotion, {
            size: this.app.state.settings.naiSettings?.preferredSize || "square",
            naiSettings: this.app.state.settings.naiSettings || {}
          });

          // 스티커를 캐릭터에 추가하고 즉시 저장
          if (!character.stickers) {
            character.stickers = [];
          }
          character.stickers.push(sticker);
          
          // 캐릭터 정보 즉시 저장
          const updatedCharacters = this.app.state.characters.map(c => 
            c.id === character.id ? character : c
          );
          await saveToBrowserStorage("personaChat_characters_v16", updatedCharacters);
          this.app.state.characters = updatedCharacters;
          
          // UI 상태 즉시 업데이트
          this.app.setState({ characters: updatedCharacters });

          results.push({ success: true, sticker, emotion });

          if (onProgress) {
            onProgress({
              type: "sticker",
              current: i + 1,
              total: missingEmotions.length,
              emotion,
              status: "completed",
              sticker
            });
          }

        } catch (error) {
          console.error(`[StickerManager] ${emotion} 스티커 생성 실패:`, error);
          
          // 실패 후에도 대기 시간을 두어 429 오류 방지
          if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
            // console.log('[StickerManager] 429 오류로 인한 추가 대기...');
            await new Promise(resolve => setTimeout(resolve, this.NAI_DELAYS.rateLimitDelay));
          } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
            // console.log('[StickerManager] 500 오류로 인한 짧은 대기...');
            await new Promise(resolve => setTimeout(resolve, this.NAI_DELAYS.serverErrorDelay));
          }
          
          results.push({
            success: false,
            error: error.message,
            emotion
          });

          if (onProgress) {
            onProgress({
              type: "sticker",
              current: i + 1,
              total: missingEmotions.length,
              emotion,
              status: "error",
              error: error.message
            });
          }
        }
      }

      const generatedStickers = results
        .filter(result => result.success)
        .map(result => result.sticker);

      return {
        success: true,
        generated: generatedStickers,
        failed: results.filter(result => !result.success),
        total: missingEmotions.length
      };
    } catch (error) {
      console.error(`[StickerManager] 기본 스티커 세트 생성 실패:`, error);
      throw error;
    }
  }

  /**
   * 모든 캐릭터의 기본 스티커 일괄 생성
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Object>} 생성 결과
   */
  async generateStickersForAllCharacters(options = {}) {
    if (!this.initializeNAI()) {
      throw new Error("NAI API 키가 설정되지 않았습니다.");
    }

    const characters = this.app.state.characters;
    const results = [];
    const { onProgress, emotions = DEFAULT_EMOTIONS } = options;

    let totalProcessed = 0;
    const totalCharacters = characters.length;

    for (const character of characters) {
      try {
        if (onProgress) {
          onProgress({
            type: "character",
            current: totalProcessed + 1,
            total: totalCharacters,
            character: character.name,
            status: "processing"
          });
        }

        const result = await this.generateBasicStickerSet(character, {
          emotions,
          onProgress: (stickerProgress) => {
            if (onProgress) {
              onProgress({
                type: "sticker",
                character: character.name,
                ...stickerProgress
              });
            }
          }
        });

        results.push({
          character: character.name,
          success: true,
          result
        });

      } catch (error) {
        results.push({
          character: character.name,
          success: false,
          error: error.message
        });
      }

      totalProcessed++;
    }

    return {
      success: true,
      results,
      summary: {
        totalCharacters: totalCharacters,
        successCount: results.filter(r => r.success).length,
        failCount: results.filter(r => !r.success).length
      }
    };
  }

  /**
   * 캐릭터의 NAI 설정 업데이트
   * @param {Object} character - 캐릭터 정보
   * @param {Object} naiSettings - NAI 설정
   */
  updateCharacterNAISettings(character, naiSettings) {
    if (!character.naiSettings) {
      character.naiSettings = {};
    }

    Object.assign(character.naiSettings, {
      autoGenerate: naiSettings.autoGenerate !== false,
      preferredSize: naiSettings.preferredSize || "square",
      lastGenerated: naiSettings.lastGenerated || null,
      generatedEmotions: naiSettings.generatedEmotions || [],
      vibeImage: naiSettings.vibeImage || null,
      ...naiSettings
    });
  }

  /**
   * NAI 생성 통계 정보 반환
   * @returns {Object} 통계 정보
   */
  getGenerationStats() {
    const characters = this.app.state.characters;
    let totalGenerated = 0;
    let charactersWithGenerated = 0;

    characters.forEach(character => {
      if (character.stickers) {
        const generatedStickers = character.stickers.filter(s => s.generated);
        totalGenerated += generatedStickers.length;
        if (generatedStickers.length > 0) {
          charactersWithGenerated++;
        }
      }
    });

    return {
      totalCharacters: characters.length,
      charactersWithGenerated,
      totalGeneratedStickers: totalGenerated,
      averageStickersPerCharacter: totalGenerated / Math.max(charactersWithGenerated, 1)
    };
  }
}

/**
 * 감정 분석 유틸리티 함수들
 */
export const EmotionAnalyzer = {
  /**
   * 메시지에서 감정 강도 분석
   * @param {string} content - 분석할 내용
   * @returns {Object} 감정별 강도 점수
   */
  analyzeEmotionIntensity(content) {
    if (!content || typeof content !== 'string') {
      return {};
    }

    const emotions = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      love: 0,
      embarrassed: 0,
      confused: 0,
      sleepy: 0,
      excited: 0
    };

    // 감탄사와 이모지에 따른 가중치
    const indicators = {
      happy: { keywords: ['하하', '히히', '크크', '웃음'], emojis: ['😊', '😄', '😂', '😆'], weight: 1 },
      sad: { keywords: ['흑흑', '엉엉', '슬퍼'], emojis: ['😢', '😭', '😞'], weight: 1 },
      angry: { keywords: ['흥', '아우', '젠장'], emojis: ['😠', '😡', '😤'], weight: 1 },
      surprised: { keywords: ['어?', '헉', '와'], emojis: ['😲', '😮', '😯'], weight: 1 },
      love: { keywords: ['하트', '좋아'], emojis: ['💕', '💖', '💘'], weight: 1 },
      embarrassed: { keywords: ['쑥스', '부끄'], emojis: ['😳', '😊'], weight: 1 },
    };

    Object.entries(indicators).forEach(([emotion, data]) => {
      data.keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          emotions[emotion] += data.weight;
        }
      });
      
      data.emojis.forEach(emoji => {
        if (content.includes(emoji)) {
          emotions[emotion] += data.weight;
        }
      });
    });

    return emotions;
  },

  /**
   * 가장 강한 감정 반환
   * @param {Object} emotionScores - 감정 점수
   * @returns {string|null} 가장 강한 감정
   */
  getDominantEmotion(emotionScores) {
    let maxScore = 0;
    let dominantEmotion = null;

    Object.entries(emotionScores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    });

    return maxScore > 0 ? dominantEmotion : null;
  }
};