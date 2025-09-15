import { t } from "../i18n.js";
import pako from "pako";

/**
 * NovelAI Image Generation Client
 * 호감도 기반 캐릭터 스티커 자동 생성을 위한 NAI API 클라이언트
 */
export class NovelAIClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = "https://image.novelai.net";
    this.options = {
      minDelay: 10000, // 최소 10초 대기
      maxAdditionalDelay: 5000, // 추가 0~5초 랜덤 (총 10~15초)
      ...options,
    };
    this.currentRequest = null; // 현재 진행 중인 요청 추적
    this.lastGenerationTime = 0;
  }

  /**
   * 사용 가능한 NAI 모델 목록 (실제 API 모델명 사용)
   */
  static MODELS = {
    "nai-diffusion-4-5-full": {
      name: "NAI Diffusion 4.5 Full",
      version: "v4.5",
      supportsCharacterPrompts: true,
      supportsVibeTransfer: true
    },
    "nai-diffusion-4-full": {
      name: "NAI Diffusion 4 Full",
      version: "v4",
      supportsCharacterPrompts: true,
      supportsVibeTransfer: true
    },
    "nai-diffusion-3": {
      name: "NAI Diffusion 3",
      version: "v3",
      supportsCharacterPrompts: false,
      supportsVibeTransfer: true
    },
    "nai-diffusion-furry-3": {
      name: "NAI Diffusion Furry 3",
      version: "v3-furry",
      supportsCharacterPrompts: false,
      supportsVibeTransfer: true
    }
  };

  /**
   * 사용 가능한 샘플러 목록
   */
  static SAMPLERS = [
    "k_euler_ancestral",
    "k_euler", 
    "k_lms",
    "k_heun",
    "k_dpm_2",
    "k_dpm_2_ancestral",
    "k_dpmpp_2s_ancestral",
    "k_dpmpp_2m",
    "ddim_v3"
  ];

  /**
   * 노이즈 스케줄 목록
   */
  static NOISE_SCHEDULES = [
    "native",
    "karras",
    "exponential",
    "polyexponential"
  ];

  /**
   * 무제한 사용 가능한 기본 사이즈 목록
   */
  static UNLIMITED_SIZES = [
    { width: 832, height: 1216, name: "portrait" }, // Normal Portrait
    { width: 1216, height: 832, name: "landscape" }, // Normal Landscape
    { width: 1024, height: 1024, name: "square" }, // Normal Square
  ];

  /**
   * 안전한 생성을 위한 대기 시간 계산
   * @returns {number} 대기 시간 (밀리초)
   */
  calculateDelay() {
    const randomDelay =
      Math.floor(Math.random() * this.options.maxAdditionalDelay);
    return this.options.minDelay + randomDelay;
  }

  /**
   * ZIP 파일에서 이미지 추출 (JSZip 사용 + fallback 시스템)
   * @param {Uint8Array} zipData - ZIP 파일 데이터
   * @returns {Promise<Uint8Array>} 추출된 이미지 데이터
   */
  async extractImageFromZip(zipData) {
    // console.log('[NAI] ZIP 파일 처리 시작, 크기:', zipData.length);
    
    // 방법 1: JSZip 사용 (가장 표준적인 방법)
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(zipData.buffer);
      const zipEntries = Object.keys(zip.files);
      
      if (zipEntries.length > 0) {
        const imageEntry = zip.file(zipEntries[0]);
        if (imageEntry) {
          // console.log('[NAI] JSZip으로 이미지 엔트리 추출:', zipEntries[0]);
          const imageBytes = await imageEntry.async('uint8array');
          // console.log('[NAI] JSZip 추출 성공:', imageBytes.length, '바이트');
          return imageBytes;
        }
      }
    } catch (jsZipError) {
      // console.warn('[NAI] JSZip 실패:', jsZipError.message);
    }
    
    // 방법 2: PNG/JPEG 시그니처를 직접 찾기
    try {
      const imageData = await this.extractImageBySignature(zipData);
      // console.log('[NAI] 시그니처 검색으로 이미지 추출 성공:', imageData.length, '바이트');
      return imageData;
    } catch (signatureError) {
      // console.warn('[NAI] 시그니처 검색 실패:', signatureError.message);
    }
    
    // 방법 3: 표준 ZIP 파싱 시도
    try {
      const imageData = await this.parseStandardZip(zipData);
      // console.log('[NAI] 표준 ZIP 파싱으로 이미지 추출 성공:', imageData.length, '바이트');
      return imageData;
    } catch (zipError) {
      // console.warn('[NAI] 표준 ZIP 파싱 실패:', zipError.message);
    }
    
    // 방법 4: 원본 데이터가 이미 이미지인지 확인
    if (this.isValidImageData(zipData)) {
      // console.log('[NAI] 원본 데이터가 이미지임을 확인');
      return zipData;
    }
    
    // 최후 수단: 원본 데이터 반환
    // console.warn('[NAI] 모든 방법 실패, 원본 데이터 그대로 사용');
    return zipData;
  }

  /**
   * 표준 ZIP 파싱
   */
  async parseStandardZip(zipData) {
    // ZIP 파일 끝에서 Central Directory End Record 찾기
    let eocdOffset = -1;
    for (let i = zipData.length - 22; i >= 0 && i > zipData.length - 65536; i--) {
      if (zipData[i] === 0x50 && zipData[i + 1] === 0x4B && 
          zipData[i + 2] === 0x05 && zipData[i + 3] === 0x06) {
        eocdOffset = i;
        break;
      }
    }
    
    if (eocdOffset === -1) {
      throw new Error('ZIP End of Central Directory 레코드를 찾을 수 없습니다');
    }
    
    // Central Directory 정보 읽기
    const dataView = new DataView(zipData.buffer, zipData.byteOffset);
    const centralDirOffset = dataView.getUint32(eocdOffset + 16, true);
    const totalEntries = dataView.getUint16(eocdOffset + 8, true);
    
    if (totalEntries === 0) {
      throw new Error('ZIP 파일에 파일이 없습니다');
    }
    
    // 첫 번째 파일의 Local Header 찾기
    const localHeaderOffset = dataView.getUint32(centralDirOffset + 42, true);
    
    if (localHeaderOffset + 30 > zipData.length) {
      throw new Error('Local Header가 파일 범위를 벗어났습니다');
    }
    
    // Local Header 정보 읽기
    const localFileNameLength = dataView.getUint16(localHeaderOffset + 26, true);
    const localExtraFieldLength = dataView.getUint16(localHeaderOffset + 28, true);
    const compressedSize = dataView.getUint32(localHeaderOffset + 18, true);
    const compressionMethod = dataView.getUint16(localHeaderOffset + 8, true);
    
    // 파일 데이터 시작 위치
    const fileDataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    
    if (fileDataOffset + compressedSize > zipData.length) {
      throw new Error('파일 데이터가 ZIP 파일 범위를 벗어났습니다');
    }
    
    const fileData = zipData.slice(fileDataOffset, fileDataOffset + compressedSize);
    
    if (fileData.length === 0) {
      throw new Error('추출된 파일 데이터가 비어있습니다');
    }
    
    // 압축 방법에 따른 처리
    if (compressionMethod === 0) {
      // 저장된 형태 (압축 없음)
      return fileData;
    } else if (compressionMethod === 8) {
      // Deflate 압축
      return await this.decompressDeflate(fileData);
    } else {
      throw new Error(`지원하지 않는 압축 방법: ${compressionMethod}`);
    }
  }

  /**
   * 이미지 시그니처로 직접 추출
   */
  async extractImageBySignature(zipData) {
    // PNG 시그니처 찾기 (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    for (let i = 0; i < zipData.length - 8; i++) {
      if (zipData[i] === 0x89 && zipData[i + 1] === 0x50 && 
          zipData[i + 2] === 0x4E && zipData[i + 3] === 0x47) {
        // PNG 시그니처 발견 - PNG 파일 끝까지 찾기
        const pngStart = i;
        
        // PNG는 IEND 청크로 끝남 (0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
        for (let j = pngStart + 8; j < zipData.length - 8; j++) {
          if (zipData[j] === 0x49 && zipData[j + 1] === 0x45 && 
              zipData[j + 2] === 0x4E && zipData[j + 3] === 0x44 &&
              zipData[j + 4] === 0xAE && zipData[j + 5] === 0x42 && 
              zipData[j + 6] === 0x60 && zipData[j + 7] === 0x82) {
            const pngEnd = j + 8;
            return zipData.slice(pngStart, pngEnd);
          }
        }
        
        // IEND를 찾지 못했으면 파일 끝까지 반환
        return zipData.slice(pngStart);
      }
    }
    
    // JPEG 시그니처 찾기 (0xFF, 0xD8)
    for (let i = 0; i < zipData.length - 2; i++) {
      if (zipData[i] === 0xFF && zipData[i + 1] === 0xD8) {
        // JPEG 시그니처 발견 - JPEG 파일 끝까지 찾기 (0xFF, 0xD9)
        const jpegStart = i;
        
        for (let j = jpegStart + 2; j < zipData.length - 2; j++) {
          if (zipData[j] === 0xFF && zipData[j + 1] === 0xD9) {
            const jpegEnd = j + 2;
            return zipData.slice(jpegStart, jpegEnd);
          }
        }
        
        // EOI를 찾지 못했으면 파일 끝까지 반환
        return zipData.slice(jpegStart);
      }
    }
    
    throw new Error('ZIP 파일에서 유효한 이미지를 찾을 수 없습니다');
  }

  /**
   * 원시 데이터에서 이미지 추출 (최후 방법)
   */
  async extractImageFromRawData(data) {
    // console.log('[NAI] 원시 데이터에서 이미지 검색 시작');
    
    // 1. 데이터 내에서 이미지 시그니처 찾기 (더 넓은 검색)
    for (let i = 0; i < data.length - 100; i++) { // 최소 100바이트는 있어야 의미있는 이미지
      // PNG 시그니처 찾기
      if (data[i] === 0x89 && data[i + 1] === 0x50 && 
          data[i + 2] === 0x4E && data[i + 3] === 0x47 &&
          data[i + 4] === 0x0D && data[i + 5] === 0x0A &&
          data[i + 6] === 0x1A && data[i + 7] === 0x0A) {
        
        // console.log('[NAI] PNG 시그니처 발견 at offset:', i);
        
        // PNG IEND 청크 찾기
        for (let j = i + 8; j < Math.min(data.length - 8, i + 10 * 1024 * 1024); j++) { // 최대 10MB 까지만
          if (data[j] === 0x00 && data[j + 1] === 0x00 && 
              data[j + 2] === 0x00 && data[j + 3] === 0x00 &&
              data[j + 4] === 0x49 && data[j + 5] === 0x45 && 
              data[j + 6] === 0x4E && data[j + 7] === 0x44) {
            
            const pngEnd = j + 12; // IEND + CRC
            // console.log('[NAI] PNG 끝 발견 at offset:', pngEnd);
            return data.slice(i, pngEnd);
          }
        }
        
        // IEND를 찾지 못했으면 나머지 데이터 모두 반환
        // console.log('[NAI] PNG IEND 찾지 못함, 나머지 데이터 모두 사용');
        return data.slice(i);
      }
      
      // JPEG 시그니처 찾기
      if (data[i] === 0xFF && data[i + 1] === 0xD8) {
        // console.log('[NAI] JPEG 시그니처 발견 at offset:', i);
        
        // JPEG EOI 마커 찾기
        for (let j = i + 2; j < Math.min(data.length - 2, i + 10 * 1024 * 1024); j++) {
          if (data[j] === 0xFF && data[j + 1] === 0xD9) {
            const jpegEnd = j + 2;
            // console.log('[NAI] JPEG 끝 발견 at offset:', jpegEnd);
            return data.slice(i, jpegEnd);
          }
        }
        
        // EOI를 찾지 못했으면 나머지 데이터 모두 반환
        // console.log('[NAI] JPEG EOI 찾지 못함, 나머지 데이터 모두 사용');
        return data.slice(i);
      }
    }
    
    throw new Error('원시 데이터에서 이미지를 찾을 수 없습니다');
  }

  /**
   * 유효한 이미지 데이터인지 확인
   */
  isValidImageData(data) {
    if (!data || data.length < 8) return false;
    
    // PNG 시그니처 (전체 8바이트)
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47 &&
        data[4] === 0x0D && data[5] === 0x0A && data[6] === 0x1A && data[7] === 0x0A) {
      return true;
    }
    
    // JPEG 시그니처 (SOI)
    if (data[0] === 0xFF && data[1] === 0xD8) {
      return true;
    }
    
    return false;
  }

  /**
   * Deflate 압축된 데이터를 해제 (pako 라이브러리 사용)
   * @param {Uint8Array} compressedData - 압축된 데이터
   * @returns {Promise<Uint8Array>} 압축 해제된 데이터
   */
  async decompressDeflate(compressedData) {
    try {
      // pako 라이브러리를 사용하여 안정적으로 deflate 압축 해제
      const decompressed = pako.inflateRaw(compressedData);
      return new Uint8Array(decompressed);
    } catch (pakoError) {
      // pako 실패 시 fallback 사용
      try {
        return await this.fallbackDeflateDecompress(compressedData);
      } catch (fallbackError) {
        // 모든 방법 실패 시 원본 데이터 반환
        console.warn('[NAI] Deflate 압축 해제 실패, 원본 데이터 사용:', fallbackError.message);
        return compressedData;
      }
    }
  }

  /**
   * 대체 deflate 압축 해제 (개선된 구현)
   * @param {Uint8Array} data - 압축된 데이터
   * @returns {Promise<Uint8Array>} 압축 해제된 데이터
   */
  async fallbackDeflateDecompress(data) {
    try {
      // 먼저 압축되지 않은 블록으로 deflate 파싱 시도
      const result = [];
      let pos = 0;
      
      while (pos < data.length) {
        // deflate 블록 헤더 읽기
        if (pos >= data.length) break;
        
        const blockHeader = data[pos];
        const isLastBlock = (blockHeader & 0x01) !== 0;
        const blockType = (blockHeader >> 1) & 0x03;
        pos++;
        
        if (blockType === 0) { // 압축되지 않은 블록 (stored)
          // 바이트 경계로 정렬
          if (pos < data.length && pos % 2 !== 0) pos++;
          
          if (pos + 4 > data.length) break;
          
          // 길이 정보 읽기 (리틀 엔디안)
          const length = data[pos] | (data[pos + 1] << 8);
          const nLength = data[pos + 2] | (data[pos + 3] << 8);
          pos += 4;
          
          // 길이 검증
          if ((length ^ nLength) !== 0xFFFF) {
            // 검증 실패 시 전체 데이터를 그대로 반환 (이미 압축 해제된 상태일 가능성)
            return data;
          }
          
          if (pos + length > data.length) break;
          
          // 압축되지 않은 데이터 복사
          for (let i = 0; i < length; i++) {
            result.push(data[pos + i]);
          }
          pos += length;
          
          if (isLastBlock) break;
        } else if (blockType === 1 || blockType === 2) {
          // 압축된 블록 - 전체 데이터를 그대로 반환 (이미 압축 해제된 상태일 가능성)
          return data;
        } else {
          // 잘못된 블록 타입 - 전체 데이터를 그대로 반환
          return data;
        }
      }
      
      if (result.length > 0) {
        return new Uint8Array(result);
      }
      
      // deflate 파싱이 실패하면 원본 데이터 반환 (이미 압축 해제된 상태일 가능성)
      return data;
    } catch (error) {
      // 모든 처리가 실패하면 원본 데이터 반환
      return data;
    }
  }

  /**
   * 마지막 생성으로부터 충분한 시간이 지났는지 확인
   * @returns {boolean} 생성 가능 여부
   */
  canGenerate() {
    const now = Date.now();
    const timeSinceLastGeneration = now - this.lastGenerationTime;
    const requiredDelay = this.options.minDelay + this.options.maxAdditionalDelay; // 최대 대기시간 사용
    return timeSinceLastGeneration >= requiredDelay;
  }

  /**
   * 모델명 유효성 검증
   * @param {string} modelName - 검증할 모델명
   * @returns {string|null} 유효한 모델명 또는 null
   */
  validateModel(modelName) {
    if (!modelName || typeof modelName !== 'string') {
      return null;
    }
    
    // 정확한 모델명 체크
    if (NovelAIClient.MODELS[modelName]) {
      return modelName;
    }
    
    // 부분 매칭으로 올바른 모델명 찾기
    const modelKey = Object.keys(NovelAIClient.MODELS).find(key => {
      const model = NovelAIClient.MODELS[key];
      return key.includes(modelName.toLowerCase()) || 
             model.name.toLowerCase().includes(modelName.toLowerCase()) ||
             model.version === modelName;
    });
    
    if (modelKey) {
      // console.warn(`[NAI] 모델명 자동 수정: "${modelName}" → "${modelKey}"`);
      return modelKey;
    }
    
    console.error(`[NAI] 지원하지 않는 모델명: "${modelName}". 기본 모델 사용.`);
    return null;
  }

  /**
   * 다음 생성 가능 시간까지 대기
   * @returns {Promise<void>}
   */
  async waitForNextGeneration() {
    const now = Date.now();
    const timeSinceLastGeneration = now - this.lastGenerationTime;
    // 더 안전한 대기 시간 계산 (최소 대기시간 + 약간의 여유)
    const requiredDelay = this.options.minDelay + Math.floor(this.options.maxAdditionalDelay / 2);

    if (timeSinceLastGeneration < requiredDelay) {
      const waitTime = requiredDelay - timeSinceLastGeneration;
      // console.log(`[NAI] API 제한 방지를 위해 ${Math.ceil(waitTime / 1000)}초 대기 중...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * 캐릭터와 감정에 맞는 프롬프트 생성 (전체 설정 지원)
   * @param {Object} character - 캐릭터 정보
   * @param {string} emotion - 감정 키워드
   * @param {Object} options - 생성 옵션
   * @returns {Object} 프롬프트 정보
   */
  buildPrompt(character, emotionData, options = {}) {
    console.log('[NAI buildPrompt] emotionData:', emotionData);
    const { naiSettings = {} } = options;

    // 캐릭터의 외모 정보 사용
    const characterPrompt = character.appearance || "";

    // AI 생성 상황 프롬프트가 있는 경우 우선 사용, 없으면 NAI 일괄 생성 목록 매핑 사용
    let emotionPrompt = "";
    let actionPrompt = "";

    if (naiSettings.customPositivePrompt?.trim()) {
      // AI가 제공한 독특한 상황 프롬프트 사용
      emotionPrompt = naiSettings.customPositivePrompt.trim();
    } else {
      // 새로운 3필드 구조 처리
      if (typeof emotionData === 'object' && emotionData.emotion) {
        // 새로운 구조체: { title, emotion, action }
        emotionPrompt = emotionData.emotion;
        actionPrompt = emotionData.action || "";
      } else {
        // 기존 문자열 형태 (하위 호환성)
        const emotionPrompts = {
          happy: "smiling, cheerful, bright eyes, joyful expression",
          sad: "sad expression, downcast eyes, melancholic, tears",
          surprised: "wide eyes, surprised, shocked expression, open mouth",
          angry: "angry, frowning, intense gaze, fierce expression",
          love: "loving gaze, romantic, heart eyes, affectionate",
          embarrassed: "blushing, shy, embarrassed, covering face",
          confused: "confused, tilted head, questioning look",
          sleepy: "sleepy, drowsy, tired, yawning",
          excited: "excited, energetic, sparkling eyes",
          neutral: "neutral expression, calm, serene",
        };
        emotionPrompt = emotionPrompts[emotionData] || emotionPrompts.neutral;
      }
    }
    
    // 스티커용 기본 프롬프트
    const basePrompt = "sticker style, simple background, clean art, centered composition";
    const qualityPrompt = "masterpiece, best quality, high resolution, detailed";
    
    // 기본 negative 프롬프트
    let negativePrompt = "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry";

    // 프롬프트 조합: 캐릭터 외형 + 감정 + 행동 및 상황 + 기본 스타일 + 품질
    let finalPrompt = `${characterPrompt}, ${emotionPrompt}`;
    if (actionPrompt) {
      finalPrompt += `, ${actionPrompt}`;
    }
    finalPrompt += `, ${basePrompt}, ${qualityPrompt}`;

    // 커스텀 negative 프롬프트 추가
    if (naiSettings.customNegativePrompt?.trim()) {
      negativePrompt += `, ${naiSettings.customNegativePrompt.trim()}`;
    }

    // 캐릭터 프롬프트 배열 구성 (v4/v4.5 전용)
    let characterPrompts = [];
    if (naiSettings.useCharacterPrompts && characterPrompt.trim()) {
      characterPrompts = [
        {
          prompt: characterPrompt.trim(),
          weight: 1.0
        }
      ];
    }

    return {
      prompt: finalPrompt,
      negative_prompt: negativePrompt,
      emotion: emotionData,
      character_name: character.name || "Unknown",
      characterPrompts: characterPrompts,
      naiSettings: naiSettings
    };
  }

  /**
   * NAI 이미지 생성 API 호출 (전체 파라미터 지원)
   * @param {Object} params - 생성 파라미터
   * @returns {Promise<Object>} 생성 결과
   */
  async generateImage(params) {
    const {
      // 기본 프롬프트
      prompt,
      negative_prompt = "",
      
      // 모델 및 이미지 설정
      model = "nai-diffusion-4-5-full",
      width = 1024,
      height = 1024,
      
      // 생성 파라미터
      scale = 3,              // CFG scale (prompt guidance strength)
      steps = 28,
      noise = 0,
      strength = 0.7,
      sampler = "k_euler_ancestral",
      seed,                   // 지정되지 않으면 랜덤 생성
      
      // SMEA 설정 (v3 전용)
      sm = false,             // SMEA (Smooth Mode Enhanced Annealing)
      sm_dyn = false,         // SMEA DYN (Dynamic SMEA)
      
      // 캐릭터 프롬프트 (v4/v4.5 전용)
      characterPrompts = [],
      
      // 이미지 관련
      vibeTransferImage,      // Vibe transfer용 이미지 (base64)
      baseImage,             // Inpaint용 기본 이미지 (base64)  
      maskImage,             // Inpaint용 마스크 이미지 (base64)
      
      // 고급 설정
      cfg_rescale = 0,                    // CFG rescale (색상 왜곡 방지)
      noise_schedule = "native",          // 노이즈 스케줄
      dynamic_thresholding = false,       // DYN (동적 임계값)
      dynamic_thresholding_percentile = 0.999,
      dynamic_thresholding_mimic_scale = 10,
      controlnet_strength = 1.0,          // ControlNet 강도
      legacy = false,                     // Legacy mode
      add_original_image = false,         // 원본 이미지 추가
      uncond_scale = 1.0,                // Unconditional scale
      
    } = params;

    // 안전한 사용을 위한 대기
    await this.waitForNextGeneration();

    // 모델 버전에 따른 올바른 JSON 구조 사용
    let requestBody;
    
    if (model === "nai-diffusion-3" || model === "nai-diffusion-furry-3") {
      // v3 모델용 구조 - parameters 객체 사용
      requestBody = {
        input: prompt,
        model: model,
        action: "generate",
        parameters: {
          width,
          height,
          scale,                              // CFG Scale (Prompt Guidance)
          sampler,
          steps,
          n_samples: 1,
          ucPreset: 0,
          qualityToggle: true,
          uc: negative_prompt,
          seed: seed || Math.floor(Math.random() * 9999999999),
          // SMEA 및 고급 설정 (v3 전용)
          sm,                                 // SMEA 활성화
          sm_dyn,                            // SMEA DYN 활성화
          dynamic_thresholding,              // DYN (동적 임계값)
          cfg_rescale,                       // CFG Rescale
          noise_schedule,                    // 노이즈 스케줄
        }
      };
    } else {
      // v4/v4.5 모델용 구조
      requestBody = {
        input: prompt,
        model: model,
        action: "generate",
        parameters: {
          params_version: 1,
          width,
          height,
          scale,
          sampler,
          steps,
          seed: seed || Math.floor(Math.random() * 9999999999),
          n_samples: 1,
          ucPreset: 0,
          qualityToggle: true,
          negative_prompt: negative_prompt,
          // v4 전용 프롬프트 구조
          v4_prompt: {
            use_coords: false,
            use_order: false, 
            caption: {
              base_caption: prompt,
              char_captions: characterPrompts || []
            }
          },
          v4_negative_prompt: {
            use_coords: false,
            use_order: false,
            caption: {
              base_caption: negative_prompt,
              char_captions: []
            }
          }
        }
      };
    }

    // 고급 기능들은 기본 구현에서 제외 (필요시 나중에 추가)


    // 디버깅을 위한 요청 JSON 로그
    // console.log('[NAI] 요청 JSON:', JSON.stringify(requestBody, null, 2));

    // AbortController로 취소 가능한 요청 생성
    const controller = new AbortController();
    this.currentRequest = controller;

    try {
      // NovelAI 이미지 생성 API 호출 (올바른 엔드포인트와 헤더)
      const response = await fetch(`${this.baseUrl}/ai/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0 (compatible; ArisuTalk/1.0)"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // 취소 신호 추가
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 실패해도 생성 시간 업데이트하여 다음 요청 시 대기하도록 함
        this.lastGenerationTime = Date.now();
        
        throw new Error(
          `NAI API 오류: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // 생성 시간 업데이트
      this.lastGenerationTime = Date.now();

      // 바이너리 데이터를 Base64로 변환 (현대적 방법)
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // ZIP 파일인지 확인 (NovelAI는 때때로 ZIP으로 압축해서 보냄)
      const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B; // 'PK' ZIP 시그니처
      
      let imageData;
      if (isZip) {
        try {
          // ZIP 파싱 함수 사용
          imageData = await this.extractImageFromZip(bytes);
          
          // ZIP에서 추출된 데이터 검증
          if (!imageData || imageData.length === 0) {
            // console.warn('[NAI] ZIP에서 추출된 데이터가 비어있음, 원본 데이터 사용');
            imageData = bytes;
          }
        } catch (zipError) {
          // console.warn('[NAI] ZIP 파일 처리 실패, 원본 데이터 사용:', zipError.message);
          imageData = bytes;
        }
      } else {
        imageData = bytes;
      }
      
      // 이미지 데이터 검증
      if (!imageData || imageData.length === 0) {
        throw new Error('이미지 데이터가 비어있습니다');
      }
      
      // 이미지 파일 시그니처 검증 (더 관대하게)
      const isPNG = imageData[0] === 0x89 && imageData[1] === 0x50 && imageData[2] === 0x4E && imageData[3] === 0x47;
      const isJPEG = imageData[0] === 0xFF && imageData[1] === 0xD8;
      
      // 이미지 시그니처가 없으면 경고만 출력하고 계속 진행 (NovelAI가 다른 형식일 수 있음)
      if (!isPNG && !isJPEG) {
        // console.warn(`[NAI] 알 수 없는 이미지 형식, 그대로 진행: 첫 바이트 ${imageData[0]} ${imageData[1]} ${imageData[2]} ${imageData[3]}`);
      }
      
      // FileReader를 사용한 더 안전한 Base64 변환
      const mimeType = isPNG ? 'image/png' : isJPEG ? 'image/jpeg' : 'image/png'; // 기본값 PNG
      const blob = new Blob([imageData], { type: mimeType });
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('FileReader 오류'));
        reader.readAsDataURL(blob);
      });
      
      // DataURL 검증 (더 관대하게)
      if (!dataUrl || !dataUrl.startsWith('data:')) {
        throw new Error('Base64 변환 결과가 올바르지 않습니다');
      }

      return {
        success: true,
        dataUrl,
        metadata: {
          prompt,
          negative_prompt,
          width,
          height,
          scale,
          steps,
          sampler,
          generatedAt: Date.now(),
        },
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        // console.log("[NAI] 이미지 생성이 취소되었습니다");
        throw new Error('이미지 생성이 사용자에 의해 취소되었습니다');
      }
      console.error("[NAI] 이미지 생성 실패:", error);
      throw new Error(`이미지 생성에 실패했습니다: ${error.message}`);
    } finally {
      // 요청 완료 후 정리
      this.currentRequest = null;
    }
  }

  /**
   * 현재 진행 중인 이미지 생성 취소
   */
  cancelGeneration() {
    if (this.currentRequest) {
      // console.log('[NAI] 이미지 생성 취소 요청');
      this.currentRequest.abort();
      this.currentRequest = null;
      return true;
    }
    return false;
  }

  /**
   * 현재 생성 중인지 확인
   */
  isGenerating() {
    return this.currentRequest !== null;
  }

  /**
   * 캐릭터용 스티커 생성 (전체 설정 지원)
   * @param {Object} character - 캐릭터 정보
   * @param {string} emotion - 감정 키워드
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Object>} 스티커 데이터
   */
  async generateSticker(character, emotion, options = {}) {
    const { naiSettings = {}, ...generateOptions } = options;
    
    // 캐릭터별 설정을 우선 사용, 없으면 전역 설정 사용
    const characterNaiSettings = character.naiSettings || {};
    const mergedSettings = { ...naiSettings, ...characterNaiSettings };
    
    // 이미지 크기 설정 (리롤시 imageSize > 캐릭터별 > 전역 > 기본값)
    const imageSize = mergedSettings.imageSize || mergedSettings.preferredSize || "square";
    const sizeConfig = NovelAIClient.UNLIMITED_SIZES.find(s => s.name === imageSize) || 
                     NovelAIClient.UNLIMITED_SIZES[2]; // 기본값: square
    
    // console.log('[NAI generateSticker] 이미지 크기 설정:', {
    //   preferredSize: mergedSettings.preferredSize,
    //   imageSize: imageSize,
    //   sizeConfig: sizeConfig,
    //   width: sizeConfig.width,
    //   height: sizeConfig.height
    // });

    // 대기 시간 설정 업데이트 (캐릭터별 설정 우선)
    if (mergedSettings.minDelay) {
      this.options.minDelay = mergedSettings.minDelay;
    }
    if (mergedSettings.maxAdditionalDelay) {
      this.options.maxAdditionalDelay = mergedSettings.maxAdditionalDelay;
    }

    const promptData = this.buildPrompt(character, emotion, { naiSettings: mergedSettings });
    
    // 완전한 생성 파라미터 구성
    const generationParams = {
      // 기본 프롬프트
      prompt: promptData.prompt,
      negative_prompt: promptData.negative_prompt,
      
      // 모델 및 이미지 설정 (캐릭터별 설정 우선)
      model: this.validateModel(mergedSettings.model) || "nai-diffusion-4-5-full",  // 기본값을 최신 권장 모델로 변경
      width: sizeConfig.width,
      height: sizeConfig.height,
      
      // 생성 파라미터 (더 안전한 기본값)
      scale: naiSettings.scale || 3,
      steps: naiSettings.steps || 28,
      sampler: naiSettings.sampler || "k_euler",
      noise_schedule: naiSettings.noise_schedule || "native",
      
      // SMEA 설정 (v3 모델 전용)
      sm: naiSettings.sm || false,          // SMEA 활성화
      sm_dyn: naiSettings.sm_dyn || false,  // SMEA DYN 활성화
      
      // 캐릭터 프롬프트 (v4/v4.5 전용) - v3 모델에서는 제외
      characterPrompts: promptData.characterPrompts,
      
      // Vibe Transfer 설정
      ...(naiSettings.vibeTransferEnabled && naiSettings.vibeTransferImage ? {
        vibeTransferImage: naiSettings.vibeTransferImage,
        reference_strength: naiSettings.vibeTransferStrength || 0.6,
        reference_information_extracted: naiSettings.vibeTransferInformationExtracted || 1.0
      } : {}),
      
      // 고급 설정
      cfg_rescale: naiSettings.cfg_rescale || 0,
      uncond_scale: naiSettings.uncond_scale || 1.0,
      dynamic_thresholding: naiSettings.dynamic_thresholding || false,
      dynamic_thresholding_percentile: naiSettings.dynamic_thresholding_percentile || 0.999,
      dynamic_thresholding_mimic_scale: naiSettings.dynamic_thresholding_mimic_scale || 10,
      legacy: naiSettings.legacy || false,
      add_original_image: naiSettings.add_original_image || false,
      
      // 추가 옵션
      ...generateOptions,
    };

    const result = await this.generateImage(generationParams);

    if (result.success) {
      // 스티커 데이터 생성
      const stickerId = `generated_${emotion}_${Date.now()}`;
      const stickerName = `${character.name || "Character"} - ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`;

      return {
        id: stickerId,
        name: stickerName,
        type: "image/png",
        dataUrl: result.dataUrl,
        emotion: emotion,
        generated: true,
        naiPrompt: promptData.prompt,
        naiNegativePrompt: promptData.negative_prompt,
        naiModel: generationParams.model,
        naiSettings: {
          steps: generationParams.steps,
          scale: generationParams.scale,
          sampler: generationParams.sampler,
          noise_schedule: generationParams.noise_schedule,
          cfg_rescale: generationParams.cfg_rescale,
          dynamic_thresholding: generationParams.dynamic_thresholding,
          vibe_transfer: naiSettings.vibeTransferEnabled || false
        },
        naiSize: `${sizeConfig.width}x${sizeConfig.height}`,
        timestamp: Date.now(),
        character: character.name || character.id,
        metadata: result.metadata,
      };
    }

    throw new Error("스티커 생성에 실패했습니다.");
  }

  /**
   * 여러 감정의 스티커를 배치로 생성 (안전한 대기시간 포함)
   * @param {Object} character - 캐릭터 정보
   * @param {string[]} emotions - 감정 목록
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Object[]>} 생성된 스티커 목록
   */
  async generateStickerBatch(character, emotions, options = {}) {
    const results = [];
    const { onProgress } = options;

    for (let i = 0; i < emotions.length; i++) {
      const emotion = emotions[i];
      
      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: emotions.length,
            emotion,
            status: "generating",
          });
        }

        const sticker = await this.generateSticker(character, emotion, options);
        results.push({ success: true, sticker, emotion });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: emotions.length,
            emotion,
            status: "completed",
            sticker,
          });
        }
      } catch (error) {
        console.error(`[NAI] ${emotion} 스티커 생성 실패:`, error);
        results.push({
          success: false,
          error: error.message,
          emotion,
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: emotions.length,
            emotion,
            status: "error",
            error: error.message,
          });
        }
      }
    }

    return results;
  }
}

/**
 * NAI 일괄 생성 목록
 */
export const DEFAULT_EMOTIONS = [
  "happy",
  "sad", 
  "surprised",
  "angry",
  "love",
  "embarrassed",
  "confused",
  "sleepy",
  "excited",
  "neutral",
];

/**
 * NAI API 키 검증
 * @param {string} apiKey - API 키
 * @returns {boolean} 유효성 여부
 */
export function validateNAIApiKey(apiKey) {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}