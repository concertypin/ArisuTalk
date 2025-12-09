/**
 * NovelAI model configurations, usable on API
 */

type NaiModelName =
	| "nai-diffusion-4-5-full"
	| "nai-diffusion-4-full"
	| "nai-diffusion-3"
	| "nai-diffusion-furry-3";
export const NOVELAI_MODELS: Record<NaiModelName, NovelAIModel> = {
	"nai-diffusion-4-5-full": {
		name: "NAI Diffusion 4.5 Full",
		version: "v4.5",
		supportsCharacterPrompts: true,
		supportsVibeTransfer: true,
	} satisfies NovelAIModel,
	"nai-diffusion-4-full": {
		name: "NAI Diffusion 4 Full",
		version: "v4",
		supportsCharacterPrompts: true,
		supportsVibeTransfer: true,
	} satisfies NovelAIModel,
	"nai-diffusion-3": {
		name: "NAI Diffusion 3",
		version: "v3",
		supportsCharacterPrompts: false,
		supportsVibeTransfer: true,
	} satisfies NovelAIModel,
	"nai-diffusion-furry-3": {
		name: "NAI Diffusion Furry 3",
		version: "v3-furry",
		supportsCharacterPrompts: false,
		supportsVibeTransfer: true,
	} satisfies NovelAIModel,
} as const;

export type NovelAIModel = {
	name: string;
	version: string;
	supportsCharacterPrompts: boolean;
	supportsVibeTransfer: boolean;
};

/**
 * Available sampler algorithms
 */
export const NOVELAI_SAMPLERS = [
	"k_euler_ancestral",
	"k_euler",
	"k_lms",
	"k_heun",
	"k_dpm_2",
	"k_dpm_2_ancestral",
	"k_dpmpp_2s_ancestral",
	"k_dpmpp_2m",
	"ddim_v3",
] as const;

/**
 * Noise schedule list
 */
export const NOVELAI_NOISE_SCHEDULES = [
	"native",
	"karras",
	"exponential",
	"polyexponential",
] as const;

/**
 * Size options for unlimited generation
 */
export const NOVELAI_UNLIMITED_SIZES = [
	{ width: 832, height: 1216, name: "portrait" }, // Normal Portrait
	{ width: 1216, height: 832, name: "landscape" }, // Normal Landscape
	{ width: 1024, height: 1024, name: "square" }, // Normal Square
] as const satisfies { width: number; height: number; name: string }[]; /**
 * NAI 일괄 생성 목록 (새로운 3필드 구조)
 */

export const DEFAULT_EMOTIONS = [
	{
		title: "기쁨",
		emotion: "smiling, cheerful, bright eyes, joyful expression",
		action: "",
	},
	{
		title: "슬픔",
		emotion: "sad expression, downcast eyes, melancholic, tears",
		action: "",
	},
	{
		title: "놀람",
		emotion: "wide eyes, surprised, shocked expression, open mouth",
		action: "",
	},
	{
		title: "분노",
		emotion: "angry, frowning, intense gaze, fierce expression",
		action: "",
	},
	{
		title: "사랑",
		emotion: "loving gaze, romantic, heart eyes, affectionate",
		action: "",
	},
	{
		title: "부끄러움",
		emotion: "blushing, shy, embarrassed, covering face",
		action: "",
	},
	{
		title: "혼란",
		emotion: "confused, tilted head, questioning look",
		action: "",
	},
	{
		title: "졸림",
		emotion: "sleepy, drowsy, tired, yawning",
		action: "",
	},
	{
		title: "흥분",
		emotion: "excited, energetic, sparkling eyes",
		action: "",
	},
	{
		title: "무표정",
		emotion: "neutral expression, calm, serene",
		action: "",
	},
];
