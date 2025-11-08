import type NaiSettings from "$components/modals/settings/NaiSettings.svelte";
import {
    NOVELAI_MODELS,
    NOVELAI_UNLIMITED_SIZES,
    type NovelAIModel,
} from "$constants/novelaiConfig";
import type { Character } from "$types/character";
import type { NaiRawRequest } from "$types/novelai";
import { fallbackChainAsync } from "$utils/fallbachChain";
import pako from "pako";

import { addLog } from "../services/logService";

type NAIEmotion = {
    //todo
};
type BinaryData = Uint8Array<ArrayBufferLike>;
const JSZip = await import("jszip");
/**
 * NovelAI Image Generation Client
 * 호감도 기반 캐릭터 스티커 자동 생성을 위한 NAI API 클라이언트
 */
export class NovelAIClient {
    apiKey: string;
    /**
     * Client options
     */
    options: {
        /**
         * Rate limiting options in milliseconds.
         * @default 10000 (10 seconds minimum delay)
         */
        minDelay: number;
        /**
         * Maximum additional random delay in milliseconds.
         * @default 5000 (0-5 seconds)
         */
        maxAdditionalDelay: number;
    };
    /**
     * API Base URL.
     * @default "https://image.novelai.net"
     */
    baseUrl: string;
    /**
     * AbortController for current request.
     * If not null, there is an ongoing request.
     */
    currentRequest: null | AbortController;
    lastGenerationTime: number;

    constructor(apiKey: string, options: any = {}) {
        this.apiKey = apiKey;
        this.baseUrl = "https://image.novelai.net";
        this.options = {
            minDelay: 10000,
            maxAdditionalDelay: 5000,
            ...options,
        };
        this.currentRequest = null;
        this.lastGenerationTime = 0;
    }

    /**
     * Calculate delay time for rate limiting.
     * @returns {number} Delay time in milliseconds.
     */
    calculateDelay(): number {
        const randomDelay = Math.floor(
            Math.random() * this.options.maxAdditionalDelay
        );
        return this.options.minDelay + randomDelay;
    }

    /**
     * Extract image from ZIP data using multiple strategies.
     * @todo This is CPU intensive and should be done in a Web Worker if possible.
     * @param {Uint8Array} zipData - ZIP data containing the image.
     * @returns {Promise<Uint8Array>} Extracted image data.
     */
    async extractImageFromZip(zipData: Uint8Array): Promise<BinaryData> {
        return await fallbackChainAsync(
            async () => {
                // Method 1: JSZip
                const zip = await JSZip.loadAsync(zipData);
                const zipEntries = Object.keys(zip.files);

                if (zipEntries.length > 0) {
                    const imageEntry = zip.file(zipEntries[0]);
                    if (imageEntry) {
                        const imageBytes = await imageEntry.async("uint8array");
                        return imageBytes;
                    }
                }
                throw new Error("JSZip으로 이미지 추출 실패");
            },
            async () => await this.extractImageBySignature(zipData),
            async () => await this.parseStandardZip(zipData),
            async () => {
                if (this.isValidImageData(zipData)) {
                    return zipData;
                }
                throw new Error("unable to find valid image data in raw data");
            },
            // Method 4: Is it already image data?
            async () => zipData
        )
            .fallback(zipData) // last resort
            .run(true);
    }

    /**
     * Parse standard ZIP structure to extract first file.
     * @todo This is CPU intensive and should be done in a Web Worker if possible.
     */
    async parseStandardZip(zipData: BinaryData): Promise<BinaryData> {
        // Find Central Directory End Record from the end of the file
        let eocdOffset = -1;
        for (
            let i = zipData.length - 22;
            i >= 0 && i > zipData.length - 65536;
            i--
        ) {
            if (
                zipData[i] === 0x50 &&
                zipData[i + 1] === 0x4b &&
                zipData[i + 2] === 0x05 &&
                zipData[i + 3] === 0x06
            ) {
                eocdOffset = i;
                break;
            }
        }

        if (eocdOffset === -1) {
            throw new Error(
                "Cannot find End of Central Directory record in ZIP file"
            );
        }

        // Read Central Directory information
        const dataView = new DataView(zipData.buffer, zipData.byteOffset);
        const centralDirOffset = dataView.getUint32(eocdOffset + 16, true);
        const totalEntries = dataView.getUint16(eocdOffset + 8, true);

        if (totalEntries === 0) {
            throw new Error("No entries found in ZIP file");
        }

        // Read first file header in Central Directory
        const localHeaderOffset = dataView.getUint32(
            centralDirOffset + 42,
            true
        );

        if (localHeaderOffset + 30 > zipData.length) {
            throw new Error("Local Header offset is out of bounds");
        }

        // Local Header information reading
        const localFileNameLength = dataView.getUint16(
            localHeaderOffset + 26,
            true
        );
        const localExtraFieldLength = dataView.getUint16(
            localHeaderOffset + 28,
            true
        );
        const compressedSize = dataView.getUint32(localHeaderOffset + 18, true);
        const compressionMethod = dataView.getUint16(
            localHeaderOffset + 8,
            true
        );

        // File data starting offset calculation
        const fileDataOffset =
            localHeaderOffset +
            30 +
            localFileNameLength +
            localExtraFieldLength;

        if (fileDataOffset + compressedSize > zipData.length) {
            throw new Error("File data offset is out of bounds");
        }

        const fileData = zipData.slice(
            fileDataOffset,
            fileDataOffset + compressedSize
        );

        if (fileData.length === 0) {
            throw new Error("Extracted file data is empty");
        }

        // Decompression based on method
        if (compressionMethod === 0) {
            // No compression
            return fileData;
        } else if (compressionMethod === 8) {
            // Deflate compression
            return await this.decompressDeflate(fileData);
        } else {
            throw new Error(
                `Unsupported compression method: ${compressionMethod}`
            );
        }
    }

    /**
     * Extract image by searching for PNG/JPEG signatures.
     */
    async extractImageBySignature(zipData: BinaryData): Promise<BinaryData> {
        // finding PNG signature (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
        for (let i = 0; i < zipData.length - 8; i++) {
            if (
                zipData[i] === 0x89 &&
                zipData[i + 1] === 0x50 &&
                zipData[i + 2] === 0x4e &&
                zipData[i + 3] === 0x47
            ) {
                // PNG signature found - find the end of PNG file
                const pngStart = i;

                // PNG ends with IEND chunk (0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
                for (let j = pngStart + 8; j < zipData.length - 8; j++) {
                    if (
                        zipData[j] === 0x49 &&
                        zipData[j + 1] === 0x45 &&
                        zipData[j + 2] === 0x4e &&
                        zipData[j + 3] === 0x44 &&
                        zipData[j + 4] === 0xae &&
                        zipData[j + 5] === 0x42 &&
                        zipData[j + 6] === 0x60 &&
                        zipData[j + 7] === 0x82
                    ) {
                        const pngEnd = j + 8;
                        return zipData.slice(pngStart, pngEnd);
                    }
                }

                // Return rest of data if IEND not found
                return zipData.slice(pngStart);
            }
        }

        // finding JPEG signature (0xFF, 0xD8)
        for (let i = 0; i < zipData.length - 2; i++) {
            if (zipData[i] === 0xff && zipData[i + 1] === 0xd8) {
                // JPEG signature found - find the end of JPEG file (0xFF, 0xD9)
                const jpegStart = i;

                for (let j = jpegStart + 2; j < zipData.length - 2; j++) {
                    if (zipData[j] === 0xff && zipData[j + 1] === 0xd9) {
                        const jpegEnd = j + 2;
                        return zipData.slice(jpegStart, jpegEnd);
                    }
                }

                // Return rest of data if EOI not found
                return zipData.slice(jpegStart);
            }
        }

        throw new Error("ZIP 파일에서 유효한 이미지를 찾을 수 없습니다");
    }

    /**
     * 원시 데이터에서 이미지 추출 (최후 방법)
     */
    async extractImageFromRawData(data) {
        // console.log('[NAI] 원시 데이터에서 이미지 검색 시작');

        // 1. 데이터 내에서 이미지 시그니처 찾기 (더 넓은 검색)
        for (let i = 0; i < data.length - 100; i++) {
            // 최소 100바이트는 있어야 의미있는 이미지
            // PNG 시그니처 찾기
            if (
                data[i] === 0x89 &&
                data[i + 1] === 0x50 &&
                data[i + 2] === 0x4e &&
                data[i + 3] === 0x47 &&
                data[i + 4] === 0x0d &&
                data[i + 5] === 0x0a &&
                data[i + 6] === 0x1a &&
                data[i + 7] === 0x0a
            ) {
                // console.log('[NAI] PNG 시그니처 발견 at offset:', i);

                // PNG IEND 청크 찾기
                for (
                    let j = i + 8;
                    j < Math.min(data.length - 8, i + 10 * 1024 * 1024);
                    j++
                ) {
                    // 최대 10MB 까지만
                    if (
                        data[j] === 0x00 &&
                        data[j + 1] === 0x00 &&
                        data[j + 2] === 0x00 &&
                        data[j + 3] === 0x00 &&
                        data[j + 4] === 0x49 &&
                        data[j + 5] === 0x45 &&
                        data[j + 6] === 0x4e &&
                        data[j + 7] === 0x44
                    ) {
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
            if (data[i] === 0xff && data[i + 1] === 0xd8) {
                // console.log('[NAI] JPEG 시그니처 발견 at offset:', i);

                // JPEG EOI 마커 찾기
                for (
                    let j = i + 2;
                    j < Math.min(data.length - 2, i + 10 * 1024 * 1024);
                    j++
                ) {
                    if (data[j] === 0xff && data[j + 1] === 0xd9) {
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

        throw new Error("원시 데이터에서 이미지를 찾을 수 없습니다");
    }

    /**
     * Check if data is valid image data (PNG or JPEG).
     */
    isValidImageData(data: BinaryData) {
        if (!data || data.length < 8) return false;

        // PNG Signature(8 bytes)
        if (
            data[0] === 0x89 &&
            data[1] === 0x50 &&
            data[2] === 0x4e &&
            data[3] === 0x47 &&
            data[4] === 0x0d &&
            data[5] === 0x0a &&
            data[6] === 0x1a &&
            data[7] === 0x0a
        ) {
            return true;
        }

        // JPEG Signature (SOI)
        if (data[0] === 0xff && data[1] === 0xd8) {
            return true;
        }

        return false;
    }

    /**
     * Deflate 압축된 데이터를 해제 (pako 라이브러리 사용)
     * @todo This is CPU intensive and should be done in a Web Worker if possible.
     * @param {Uint8Array} compressedData - 압축된 데이터
     * @returns {Promise<Uint8Array>} 압축 해제된 데이터
     */
    async decompressDeflate(compressedData: Uint8Array): Promise<Uint8Array> {
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
                console.warn(
                    "[NAI] Deflate 압축 해제 실패, 원본 데이터 사용:",
                    String(fallbackError)
                );
                return compressedData;
            }
        }
    }

    /**
     * 대체 deflate 압축 해제 (개선된 구현)
     * @todo This is CPU intensive and should be done in a Web Worker if possible.
     * @param {Uint8Array} data - 압축된 데이터
     * @returns {Promise<Uint8Array>} 압축 해제된 데이터
     */
    async fallbackDeflateDecompress(data: Uint8Array): Promise<Uint8Array> {
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

                if (blockType === 0) {
                    // 압축되지 않은 블록 (stored)
                    // 바이트 경계로 정렬
                    if (pos < data.length && pos % 2 !== 0) pos++;

                    if (pos + 4 > data.length) break;

                    // 길이 정보 읽기 (리틀 엔디안)
                    const length = data[pos] | (data[pos + 1] << 8);
                    const nLength = data[pos + 2] | (data[pos + 3] << 8);
                    pos += 4;

                    // 길이 검증
                    if ((length ^ nLength) !== 0xffff) {
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
     * Check if generation is allowed based on rate limiting.
     * @returns {boolean} True if generation is allowed, false otherwise.
     */
    canGenerate(): boolean {
        const now = Date.now();
        const timeSinceLastGeneration = now - this.lastGenerationTime;
        const requiredDelay =
            this.options.minDelay + this.options.maxAdditionalDelay; // Maximum possible delay
        return timeSinceLastGeneration >= requiredDelay;
    }

    /**
     * Validate and correct model name.
     * @param modelName - Model name to validate.
     * @returns Model name if valid, null otherwise.
     */
    validateModel(modelName: string): keyof typeof NOVELAI_MODELS | null {
        type ModelKey = keyof typeof NOVELAI_MODELS;

        function isExactModelKey(key: string): key is ModelKey {
            // Helper function to check exact match
            // Idk why TS is not recognizing type without this
            return key in NOVELAI_MODELS;
        }

        if (!modelName || typeof modelName !== "string") {
            return null;
        }

        // Exact match first
        if (isExactModelKey(modelName)) {
            return modelName;
        }

        // Partial match search
        const modelKey = (Object.keys(NOVELAI_MODELS) as ModelKey[]).find(
            (key) => {
                const model: NovelAIModel | undefined = NOVELAI_MODELS[key];
                return (
                    key.toLowerCase().includes(modelName.toLowerCase()) || // Ignore case partial match
                    model?.name
                        .toLowerCase()
                        .includes(modelName.toLowerCase()) || // Name partial match
                    model?.version === modelName // Version exact match
                );
            }
        );

        if (modelKey) {
            console.warn(
                `[NAI] Model name autofix: "${modelName}" → "${modelKey}"`
            );
            return modelKey;
        }

        console.error(
            `[NAI] unrecognized model name: "${modelName}", fallback to default`
        );
        return null;
    }

    /**
     * Wait for the next generation slot based on rate limiting.
     * Resolves when it's safe to generate the next image.
     * @returns {Promise<void>}
     */
    async waitForNextGeneration(): Promise<void> {
        const now = Date.now();
        const timeSinceLastGeneration = now - this.lastGenerationTime;
        // Safe margin: half of min + max delay
        const requiredDelay =
            this.options.minDelay +
            Math.floor(this.options.maxAdditionalDelay / 2);

        if (timeSinceLastGeneration < requiredDelay) {
            const waitTime = requiredDelay - timeSinceLastGeneration;
            return new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }

    /**
     * 캐릭터와 감정에 맞는 프롬프트 생성 (전체 설정 지원)
     * @param {Object} character - 캐릭터 정보
     * @param {string} emotion - 감정 키워드
     * @param {Object} options - 생성 옵션
     * @returns {Object} 프롬프트 정보
     */
    buildPrompt(
        character: Character,
        emotionData: string | NAIEmotion,
        options: object = {}
    ): {
        prompt: string;
        negative_prompt: string;
        emotion: string | NAIEmotion;
        character_name: any;
        characterPrompts: { prompt: string; weight: number }[];
        naiSettings: any;
    } {
        console.log("[NAI buildPrompt] emotionData:", emotionData);
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
            emotionPrompt = emotionData.emotion;
            actionPrompt = emotionData.action || "";
        }

        // 스티커용 기본 프롬프트
        const basePrompt =
            "sticker style, simple background, clean art, centered composition";
        const qualityPrompt =
            "masterpiece, best quality, high resolution, detailed";

        // 기본 negative 프롬프트
        let negativePrompt =
            "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry";

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
        let characterPrompts: { prompt: string; weight: number }[] = [];
        if (naiSettings.useCharacterPrompts && characterPrompt.trim()) {
            characterPrompts = [
                {
                    prompt: characterPrompt.trim(),
                    weight: 1.0,
                },
            ];
        }

        return {
            prompt: finalPrompt,
            negative_prompt: negativePrompt,
            emotion: emotionData,
            character_name: character.name || "Unknown",
            characterPrompts: characterPrompts,
            naiSettings: naiSettings,
        };
    }

    /**
     * NAI 이미지 생성 API 호출 (전체 파라미터 지원)
     * @param {Object} params - 생성 파라미터
     * @returns {Promise<Object>} 생성 결과
     */
    async generateImage(params: NaiSettings): Promise<object> {
        const {
            // 기본 프롬프트
            prompt,
            negative_prompt = "",

            // 모델 및 이미지 설정
            model = "nai-diffusion-4-5-full",
            width = 1024,
            height = 1024,

            // 생성 파라미터
            scale = 3, // CFG scale (prompt guidance strength)
            steps = 28,
            noise = 0,
            strength = 0.7,
            sampler = "k_euler_ancestral",
            seed, // 지정되지 않으면 랜덤 생성

            // SMEA 설정 (v3 전용)
            sm = false, // SMEA (Smooth Mode Enhanced Annealing)
            sm_dyn = false, // SMEA DYN (Dynamic SMEA)

            // 캐릭터 프롬프트 (v4/v4.5 전용)
            characterPrompts = [],

            // 이미지 관련
            vibeTransferImage, // Vibe transfer용 이미지 (base64)
            baseImage, // Inpaint용 기본 이미지 (base64)
            maskImage, // Inpaint용 마스크 이미지 (base64)

            // 고급 설정
            cfg_rescale = 0, // CFG rescale (색상 왜곡 방지)
            noise_schedule = "native", // 노이즈 스케줄
            dynamic_thresholding = false, // DYN (동적 임계값)
            dynamic_thresholding_percentile = 0.999,
            dynamic_thresholding_mimic_scale = 10,
            controlnet_strength = 1.0, // ControlNet 강도
            legacy = false, // Legacy mode
            add_original_image = false, // 원본 이미지 추가
            uncond_scale = 1.0, // Unconditional scale
        } = params;

        // 안전한 사용을 위한 대기
        await this.waitForNextGeneration();

        // 모델 버전에 따른 올바른 JSON 구조 사용
        let requestBody: NaiRawRequest;

        if (model === "nai-diffusion-3" || model === "nai-diffusion-furry-3") {
            // v3 모델용 구조 - parameters 객체 사용
            requestBody = {
                input: prompt,
                model: model,
                action: "generate",
                parameters: {
                    width,
                    height,
                    scale, // CFG Scale (Prompt Guidance)
                    sampler,
                    steps,
                    n_samples: 1,
                    ucPreset: 0,
                    qualityToggle: true,
                    /**
                     * @todo Needs verify that `uc` is existing field for API
                     */
                    //@ts-ignore
                    uc: negative_prompt,
                    seed: seed || Math.floor(Math.random() * 9999999999),
                    // SMEA 및 고급 설정 (v3 전용)
                    sm, // SMEA 활성화
                    sm_dyn, // SMEA DYN 활성화
                    dynamic_thresholding, // DYN (동적 임계값)
                    cfg_rescale, // CFG Rescale
                    noise_schedule, // 노이즈 스케줄
                },
            } satisfies NaiRawRequest;
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
                    // v4-specific settings
                    v4_prompt: {
                        use_coords: false,
                        use_order: false,
                        caption: {
                            base_caption: prompt,
                            char_captions: characterPrompts || [],
                        },
                    },
                    v4_negative_prompt: {
                        use_coords: false,
                        use_order: false,
                        caption: {
                            base_caption: negative_prompt,
                            char_captions: [],
                        },
                    },
                },
            } satisfies NaiRawRequest;
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
                    Authorization: `Bearer ${this.apiKey}`,
                    Accept: "*/*",
                    "User-Agent": "Mozilla/5.0 (compatible; ArisuTalk/1.0)",
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
            const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // 'PK' ZIP 시그니처

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
                    // console.warn('[NAI] ZIP 파일 처리 실패, 원본 데이터 사용:', zipString(error));
                    imageData = bytes;
                }
            } else {
                imageData = bytes;
            }

            // 이미지 데이터 검증
            if (!imageData || imageData.length === 0) {
                throw new Error("이미지 데이터가 비어있습니다");
            }

            // 이미지 파일 시그니처 검증 (더 관대하게)
            const isPNG =
                imageData[0] === 0x89 &&
                imageData[1] === 0x50 &&
                imageData[2] === 0x4e &&
                imageData[3] === 0x47;
            const isJPEG = imageData[0] === 0xff && imageData[1] === 0xd8;

            // 이미지 시그니처가 없으면 경고만 출력하고 계속 진행 (NovelAI가 다른 형식일 수 있음)
            if (!isPNG && !isJPEG) {
                // console.warn(`[NAI] 알 수 없는 이미지 형식, 그대로 진행: 첫 바이트 ${imageData[0]} ${imageData[1]} ${imageData[2]} ${imageData[3]}`);
            }

            // FileReader를 사용한 더 안전한 Base64 변환
            const mimeType = isPNG
                ? "image/png"
                : isJPEG
                  ? "image/jpeg"
                  : "image/png"; // 기본값 PNG
            const blob = new Blob([imageData], { type: mimeType });
            const dataUrl = await new Promise<string | null>(
                (resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () =>
                        resolve(
                            typeof reader.result === "string"
                                ? reader.result
                                : null
                        );
                    reader.onerror = () => reject(new Error("FileReader 오류"));
                    reader.readAsDataURL(blob);
                }
            );

            // DataURL 검증 (더 관대하게)
            if (!dataUrl || !dataUrl.startsWith("data:")) {
                throw new Error("Base64 변환 결과가 올바르지 않습니다");
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
            if (error instanceof DOMException && error.name === "AbortError") {
                // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
                // console.log("[NAI] 이미지 생성이 취소되었습니다");
                throw new Error("이미지 생성이 사용자에 의해 취소되었습니다");
            }
            console.error("[NAI] 이미지 생성 실패:", error);
            throw new Error(`이미지 생성에 실패했습니다: ${String(error)}`);
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
     * NAI 사용자 구독 정보 조회
     * @returns {Promise<Object>} 구독 정보
     */
    async getUserSubscription(): Promise<object> {
        if (!this.apiKey) {
            throw new Error("API key is not set.");
        }

        const response = await fetch(
            `https://api.novelai.net/user/subscription`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to get NAI user subscription: ${response.status} ${response.statusText} - ${errorText}`
            );
        }

        return await response.json();
    }

    /**
     * 캐릭터용 스티커 생성 (전체 설정 지원)
     * @param {Object} character - 캐릭터 정보
     * @param {string} emotion - 감정 키워드
     * @param {Object} options - 생성 옵션
     * @returns {Promise<Object>} 스티커 데이터
     */
    async generateSticker(
        character: Character,
        emotion: string | NAIEmotion,
        options: object = {}
    ): Promise<object> {
        const { naiSettings = {}, ...generateOptions } = options;

        // 캐릭터별 설정을 우선 사용, 없으면 전역 설정 사용
        const characterNaiSettings = character.naiSettings || {};
        const mergedSettings = { ...naiSettings, ...characterNaiSettings };

        // 이미지 크기 설정 (리롤시 imageSize > 캐릭터별 > 전역 > 기본값)
        const imageSize =
            mergedSettings.imageSize ||
            mergedSettings.preferredSize ||
            "square";
        const sizeConfig =
            NOVELAI_UNLIMITED_SIZES.find((s) => s.name === imageSize) ||
            NOVELAI_UNLIMITED_SIZES[2]; // 기본값: square

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

        const promptData = this.buildPrompt(character, emotion, {
            naiSettings: mergedSettings,
        });

        // 완전한 생성 파라미터 구성
        const generationParams: NaiSettings = {
            // 기본 프롬프트
            prompt: promptData.prompt,
            negative_prompt: promptData.negative_prompt,

            // 모델 및 이미지 설정 (캐릭터별 설정 우선)
            model:
                this.validateModel(mergedSettings.model) ||
                "nai-diffusion-4-5-full", // 기본값을 최신 권장 모델로 변경
            width: sizeConfig.width,
            height: sizeConfig.height,

            // 생성 파라미터 (더 안전한 기본값)
            scale: naiSettings.scale || 3,
            steps: naiSettings.steps || 28,
            sampler: naiSettings.sampler || "k_euler",
            noise_schedule: naiSettings.noise_schedule || "native",

            // SMEA 설정 (v3 모델 전용)
            sm: naiSettings.sm || false, // SMEA 활성화
            sm_dyn: naiSettings.sm_dyn || false, // SMEA DYN 활성화

            // 캐릭터 프롬프트 (v4/v4.5 전용) - v3 모델에서는 제외
            characterPrompts: promptData.characterPrompts,

            // Vibe Transfer 설정
            ...(naiSettings.vibeTransferEnabled && naiSettings.vibeTransferImage
                ? {
                      vibeTransferImage: naiSettings.vibeTransferImage,
                      reference_strength:
                          naiSettings.vibeTransferStrength || 0.6,
                      reference_information_extracted:
                          naiSettings.vibeTransferInformationExtracted || 1.0,
                  }
                : {}),

            // 고급 설정
            cfg_rescale: naiSettings.cfg_rescale || 0,
            uncond_scale: naiSettings.uncond_scale || 1.0,
            dynamic_thresholding: naiSettings.dynamic_thresholding || false,
            dynamic_thresholding_percentile:
                naiSettings.dynamic_thresholding_percentile || 0.999,
            dynamic_thresholding_mimic_scale:
                naiSettings.dynamic_thresholding_mimic_scale || 10,
            legacy: naiSettings.legacy || false,
            add_original_image: naiSettings.add_original_image || false,

            // 추가 옵션
            ...generateOptions,
        };

        const logData = {
            type: "structured",
            characterName: character.name,
            chatId: null,
            chatType: "nai_generation",
            data: {
                personaInput: {
                    characterName: character.name,
                    characterPrompt: character.prompt,
                    characterId: character.id,
                },
                systemPrompt: promptData.prompt,
                parameters: generationParams,
                metadata: {
                    timestamp: new Date().toISOString(),
                    apiProvider: "novelai",
                    model: generationParams.model,
                },
            },
        };

        try {
            const result = await this.generateImage(generationParams);
            logData.data.outputResponse = { success: true, ...result };
            addLog(logData);

            if (result.success) {
                // 스티커 데이터 생성
                let emotionKey, emotionDisplayName;

                if (typeof emotion === "object" && emotion.emotion) {
                    // 새로운 3필드 구조
                    emotionKey = emotion.emotion;
                    emotionDisplayName = emotion.title || emotion.emotion;
                } else if (typeof emotion === "string") {
                    // 기존 문자열 구조
                    emotionKey = emotion;
                    emotionDisplayName = emotion;
                } else {
                    emotionKey = "unknown";
                    emotionDisplayName = "Unknown";
                }

                const stickerId = `generated_${emotionKey}_${Date.now()}`;
                const stickerName = `${character.name || "Character"} - ${emotionDisplayName.charAt(0).toUpperCase() + emotionDisplayName.slice(1)}`;

                return {
                    id: stickerId,
                    name: stickerName,
                    type: "image/png",
                    dataUrl: result.dataUrl,
                    emotion: emotionKey,
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
                        dynamic_thresholding:
                            generationParams.dynamic_thresholding,
                        vibe_transfer: naiSettings.vibeTransferEnabled || false,
                    },
                    naiSize: `${sizeConfig.width}x${sizeConfig.height}`,
                    timestamp: Date.now(),
                    character: character.name || character.id,
                    metadata: result.metadata,
                };
            }
        } catch (error) {
            logData.data.outputResponse = {
                success: false,
                error: String(error),
            };
            addLog(logData);
            throw error;
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
    async generateStickerBatch(
        character: object,
        emotions: string[],
        options: object = {}
    ): Promise<object[]> {
        const results: {
            success: boolean;
            sticker?: object;
            error?: string;
            emotion: string;
        }[] = [];
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

                const sticker = await this.generateSticker(
                    character,
                    emotion,
                    options
                );
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
                    error: String(error),
                    emotion,
                });

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: emotions.length,
                        emotion,
                        status: "error",
                        error: String(error),
                    });
                }
            }
        }

        return results;
    }
}

/**
 * Validate NovelAI API key format. This is a basic check, not a full verification.
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key is valid
 */
export function validateNAIApiKey(apiKey: string): boolean {
    return typeof apiKey === "string" && apiKey.trim().length > 0;
}

export default NovelAIClient;
