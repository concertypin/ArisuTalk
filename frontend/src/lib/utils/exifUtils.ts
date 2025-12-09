/**
 * EXIF 데이터 처리 유틸리티
 * NAI 프롬프트 및 이미지 메타데이터 추출
 */

export interface ExifData {
    make?: string;
    model?: string;
    software?: string;
    userComment?: string;
    naiPrompt?: string;
    naiNegativePrompt?: string;
    naiSteps?: number | string;
    naiScale?: number | string;
    naiCfgScale?: number | string;
    naiSeed?: number | string;
    naiSampler?: string;
    naiModel?: string;
    comment?: string;
    description?: string;
    steps?: number | string;
    cfg_scale?: number | string;
    [key: string]: any;
}

export interface FormattedExifInfo {
    basic: {
        make?: string;
        model?: string;
        software?: string;
        comment?: string;
        description?: string;
    };
    nai: {
        prompt?: string;
        negativePrompt?: string;
        steps?: number | string;
        scale?: number | string;
        cfgScale?: number | string;
        seed?: number | string;
        sampler?: string;
        model?: string;
    };
    raw: ExifData;
}

export interface RerollInfo {
    prompt: string;
    negativePrompt: string;
    steps: number | string;
    scale: number | string;
    sampler: string;
    model: string;
}

/**
 * 이미지에서 EXIF 데이터 추출
 */
export async function extractExifData(imageData: File | string): Promise<ExifData> {
    try {
        let arrayBuffer: ArrayBuffer;

        if (typeof imageData === "string") {
            // Data URL인 경우
            if (imageData.startsWith("data:")) {
                const base64Data = imageData.split(",")[1];
                const binaryString = atob(base64Data);
                arrayBuffer = new ArrayBuffer(binaryString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < binaryString.length; i++) {
                    uint8Array[i] = binaryString.charCodeAt(i);
                }
            } else {
                throw new Error("Invalid image data format");
            }
        } else if (imageData instanceof File) {
            // File 객체인 경우
            arrayBuffer = await imageData.arrayBuffer();
        } else {
            throw new Error("Unsupported image data type");
        }

        return parseExifFromArrayBuffer(arrayBuffer);
    } catch (error) {
        console.warn("EXIF 데이터 추출 실패:", error);
        return {};
    }
}

/**
 * ArrayBuffer에서 EXIF 데이터 파싱
 */
function parseExifFromArrayBuffer(arrayBuffer: ArrayBuffer): ExifData {
    const uint8Array = new Uint8Array(arrayBuffer);
    const exifData: ExifData = {};

    // PNG 파일 확인 (PNG 시그니처: 89 50 4E 47 0D 0A 1A 0A)
    if (
        uint8Array[0] === 0x89 &&
        uint8Array[1] === 0x50 &&
        uint8Array[2] === 0x4e &&
        uint8Array[3] === 0x47
    ) {
        return parsePngMetadata(uint8Array);
    }

    // JPEG 파일 확인 (0xFFD8로 시작)
    if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
        return parseJpegExif(uint8Array);
    }

    return exifData;
}

/**
 * PNG 메타데이터 파싱 (NAI 프롬프트 정보 포함)
 */
function parsePngMetadata(uint8Array: Uint8Array): ExifData {
    const metadata: ExifData = {};
    let offset = 8; // PNG 시그니처 건너뛰기

    while (offset < uint8Array.length) {
        // 청크 길이 (4바이트)
        const chunkLength = readUint32Big(uint8Array, offset);
        offset += 4;

        // 청크 타입 (4바이트)
        const chunkType = String.fromCharCode(
            uint8Array[offset],
            uint8Array[offset + 1],
            uint8Array[offset + 2],
            uint8Array[offset + 3]
        );
        offset += 4;

        // 청크 데이터
        const chunkData = uint8Array.slice(offset, offset + chunkLength);

        if (chunkType === "tEXt" || chunkType === "zTXt") {
            // 텍스트 청크에서 메타데이터 추출
            const textData = parsePngTextChunk(chunkData, chunkType === "zTXt");
            Object.assign(metadata, textData);
        }

        offset += chunkLength + 4; // 데이터 + CRC

        // IEND 청크에 도달하면 종료
        if (chunkType === "IEND") break;
    }

    return metadata;
}

/**
 * PNG 텍스트 청크 파싱
 */
function parsePngTextChunk(chunkData: Uint8Array, isCompressed: boolean): ExifData {
    const textData: ExifData = {};

    try {
        // 키워드와 값 분리 (null 바이트로 구분)
        let nullIndex = 0;
        for (let i = 0; i < chunkData.length; i++) {
            if (chunkData[i] === 0) {
                nullIndex = i;
                break;
            }
        }

        const keyword = String.fromCharCode(...chunkData.slice(0, nullIndex));
        const valueBytes = chunkData.slice(nullIndex + 1);

        let value: string;
        if (isCompressed) {
            // zTXt는 압축된 데이터이므로 현재는 스킵
            value = "[Compressed text - not supported]";
        } else {
            // tEXt는 일반 텍스트
            value = String.fromCharCode(...valueBytes);
        }

        // NAI 관련 키워드 매핑
        if (keyword === "Comment" || keyword === "Description") {
            // JSON 형태인지 확인
            try {
                const jsonData = JSON.parse(value);
                if (jsonData.prompt) {
                    textData.naiPrompt = jsonData.prompt;
                }
                if (jsonData.negative_prompt) {
                    textData.naiNegativePrompt = jsonData.negative_prompt;
                }
                if (jsonData.steps) {
                    textData.naiSteps = jsonData.steps;
                }
                if (jsonData.cfg_scale) {
                    textData.naiCfgScale = jsonData.cfg_scale;
                }
                if (jsonData.seed) {
                    textData.naiSeed = jsonData.seed;
                }
            } catch {
                // JSON이 아니면 일반 텍스트로 처리
                textData[keyword.toLowerCase()] = value;
            }
        } else {
            textData[keyword.toLowerCase()] = value;
        }
    } catch (error) {
        console.warn("PNG 텍스트 청크 파싱 오류:", error);
    }

    return textData;
}

/**
 * JPEG EXIF 데이터 파싱
 */
function parseJpegExif(uint8Array: Uint8Array): ExifData {
    // APP1 마커 찾기 (0xFFE1)
    let offset = 2;
    while (offset < uint8Array.length - 1) {
        if (uint8Array[offset] === 0xff && uint8Array[offset + 1] === 0xe1) {
            // APP1 세그먼트 발견
            const segmentLength =
                (uint8Array[offset + 2] << 8) | uint8Array[offset + 3];
            const segmentData = uint8Array.slice(
                offset + 4,
                offset + 4 + segmentLength - 2
            );

            // "Exif\0\0" 헤더 확인
            if (
                segmentData[0] === 0x45 &&
                segmentData[1] === 0x78 &&
                segmentData[2] === 0x69 &&
                segmentData[3] === 0x66
            ) {
                // TIFF 헤더 시작점
                const tiffOffset = 6;
                return parseTiffData(segmentData, tiffOffset);
            }
        }
        offset += 2;
    }

    return {};
}

/**
 * TIFF 데이터에서 태그 파싱
 */
function parseTiffData(data: Uint8Array, offset: number): ExifData {
    const tags: ExifData = {};

    try {
        // TIFF 헤더 확인
        const byteOrder = String.fromCharCode(data[offset], data[offset + 1]);
        const isLittleEndian = byteOrder === "II";

        // IFD0 오프셋 읽기
        const ifd0Offset = readUint32(data, offset + 4, isLittleEndian);

        // IFD0 엔트리 개수
        const numEntries = readUint16(
            data,
            offset + ifd0Offset,
            isLittleEndian
        );

        // 각 엔트리 파싱
        for (let i = 0; i < numEntries; i++) {
            const entryOffset = offset + ifd0Offset + 2 + i * 12;
            const tag = readUint16(data, entryOffset, isLittleEndian);
            const type = readUint16(data, entryOffset + 2, isLittleEndian);
            const count = readUint32(data, entryOffset + 4, isLittleEndian);
            const valueOffset = readUint32(
                data,
                entryOffset + 8,
                isLittleEndian
            );

            // 특정 태그들만 처리
            switch (tag) {
                case 0x010f: // Make
                    tags.make = readString(data, offset + valueOffset, count);
                    break;
                case 0x0110: // Model
                    tags.model = readString(data, offset + valueOffset, count);
                    break;
                case 0x0131: // Software
                    tags.software = readString(
                        data,
                        offset + valueOffset,
                        count
                    );
                    break;
                case 0x9286: // UserComment
                    tags.userComment = readUserComment(
                        data,
                        offset + valueOffset,
                        count
                    );
                    break;
            }
        }

        // NAI 프롬프트 정보 추출
        extractNAIPromptInfo(tags);
    } catch (error) {
        console.warn("TIFF 데이터 파싱 오류:", error);
    }

    return tags;
}

/**
 * UserComment에서 NAI 프롬프트 정보 추출
 */
function extractNAIPromptInfo(tags: ExifData): void {
    if (tags.userComment) {
        try {
            // JSON 형태의 데이터 파싱 시도
            const jsonMatch = tags.userComment.match(/\{.*\}/);
            if (jsonMatch) {
                const metadata = JSON.parse(jsonMatch[0]);

                // NAI 관련 정보 추출
                if (metadata.prompt) {
                    tags.naiPrompt = metadata.prompt;
                }
                if (metadata.uc) {
                    tags.naiNegativePrompt = metadata.uc;
                }
                if (metadata.steps) {
                    tags.naiSteps = metadata.steps;
                }
                if (metadata.scale) {
                    tags.naiScale = metadata.scale;
                }
                if (metadata.seed) {
                    tags.naiSeed = metadata.seed;
                }
                if (metadata.sampler) {
                    tags.naiSampler = metadata.sampler;
                }
                if (metadata.model) {
                    tags.naiModel = metadata.model;
                }
            }
        } catch (error) {
            // JSON 파싱 실패 시 텍스트로 처리
            console.debug("UserComment JSON 파싱 실패, 텍스트로 처리");
        }
    }
}

/**
 * UserComment 필드 읽기 (특수 형식 처리)
 */
function readUserComment(data: Uint8Array, offset: number, count: number): string {
    // UserComment는 보통 8바이트 헤더 + 실제 데이터
    const headerSize = 8;
    if (count <= headerSize) return "";

    const actualData = data.slice(offset + headerSize, offset + count);
    return new TextDecoder("utf-8").decode(actualData);
}

/**
 * 문자열 읽기
 */
function readString(data: Uint8Array, offset: number, count: number): string {
    const stringData = data.slice(offset, offset + count - 1); // null terminator 제외
    return new TextDecoder("utf-8").decode(stringData);
}

/**
 * Little/Big Endian 처리하여 16비트 정수 읽기
 */
function readUint16(data: Uint8Array, offset: number, isLittleEndian: boolean): number {
    if (isLittleEndian) {
        return data[offset] | (data[offset + 1] << 8);
    } else {
        return (data[offset] << 8) | data[offset + 1];
    }
}

/**
 * Little/Big Endian 처리하여 32비트 정수 읽기
 */
function readUint32(data: Uint8Array, offset: number, isLittleEndian: boolean): number {
    if (isLittleEndian) {
        return (
            data[offset] |
            (data[offset + 1] << 8) |
            (data[offset + 2] << 16) |
            (data[offset + 3] << 24)
        );
    } else {
        return (
            (data[offset] << 24) |
            (data[offset + 1] << 16) |
            (data[offset + 2] << 8) |
            data[offset + 3]
        );
    }
}

/**
 * 32비트 정수 읽기 (Big Endian)
 */
function readUint32Big(data: Uint8Array, offset: number): number {
    return (
        (data[offset] << 24) |
        (data[offset + 1] << 16) |
        (data[offset + 2] << 8) |
        data[offset + 3]
    );
}

/**
 * EXIF 데이터를 사용자 친화적 형태로 포맷
 */
export function formatExifInfo(exifData: ExifData): FormattedExifInfo {
    const formatted: FormattedExifInfo = {
        basic: {},
        nai: {},
        raw: exifData,
    };

    // 기본 정보
    if (exifData.make) formatted.basic.make = exifData.make;
    if (exifData.model) formatted.basic.model = exifData.model;
    if (exifData.software) formatted.basic.software = exifData.software;

    // NAI 관련 정보
    if (exifData.naiPrompt) formatted.nai.prompt = exifData.naiPrompt;
    if (exifData.naiNegativePrompt)
        formatted.nai.negativePrompt = exifData.naiNegativePrompt;
    if (exifData.naiSteps) formatted.nai.steps = exifData.naiSteps as number;
    if (exifData.naiScale) formatted.nai.scale = exifData.naiScale as number;
    if (exifData.naiCfgScale) formatted.nai.cfgScale = exifData.naiCfgScale as number;
    if (exifData.naiSeed) formatted.nai.seed = exifData.naiSeed as number;
    if (exifData.naiSampler) formatted.nai.sampler = exifData.naiSampler;
    if (exifData.naiModel) formatted.nai.model = exifData.naiModel;

    // PNG 메타데이터의 기타 텍스트 정보 처리
    if (exifData.comment) formatted.basic.comment = exifData.comment;
    if (exifData.description)
        formatted.basic.description = exifData.description;

    return formatted;
}

/**
 * NAI 리롤을 위한 프롬프트 정보 추출
 */
export function extractRerollInfo(exifData: ExifData): RerollInfo | null {
    if (!exifData.naiPrompt) {
        return null;
    }

    return {
        prompt: exifData.naiPrompt,
        negativePrompt: exifData.naiNegativePrompt || "",
        steps: exifData.naiSteps || exifData.steps || 28, // 원본 설정값 우선 사용
        scale:
            exifData.naiScale ||
            exifData.naiCfgScale ||
            exifData.cfg_scale ||
            3, // NAI 기본값 3
        sampler: exifData.naiSampler || "k_euler_ancestral",
        model: exifData.naiModel || "nai-diffusion-4",
        // 시드는 제외 (리롤 시 새로운 시드 사용)
    };
}
