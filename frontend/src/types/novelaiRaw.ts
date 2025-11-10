/**
 * @fileoverview @copyright {@link https://image.novelai.net/docs/index.html}
 */
/**
 *
 */
interface ImageCoordinates {
    x?: number;
    y?: number;
}

interface ImageImg2ImgParams {
    color_correct?: boolean;
    extra_noise_seed?: number;
    noise?: number;
    strength?: number;
}

export interface NaiAPIParamRequest {
    add_original_image?: boolean;
    cfg_rescale?: number;
    color_correct?: boolean;
    /** used by ControlNet */
    controlnet_condition?: string;
    controlnet_model?: string;
    controlnet_strength?: number;
    /**
     * (Summer Sampler update) add ancestral noise even on the final step of sampling, despite the fact we're not going to run the denoiser again, default true (maintaining bug-for-bug compatibility)
     */
    deliberate_euler_ancestral_bug?: boolean;
    /**
     * For CR: set `caption` with a `base_caption` of `"character"` or `"character&style"`
     */
    director_reference_descriptions?: ImageV4ConditionInput[];
    /**
     * For CR: 1024x1536 or 1536x1024 or 1472x1472 with black padding to fit
     */
    director_reference_images?: string[];
    /**
     * For CR: 0-1
     */
    director_reference_information_extracted?: number[];
    /**
     * For CR: Maps to Fidelity slider (0-1)
     */
    director_reference_secondary_strength_values?: number[];
    /**
     * API external name. 0-1
     */
    director_reference_strength_values?: number[];
    dynamic_thresholding?: boolean;
    extra_noise_seed?: number;
    height?: number;
    image?: string;
    /**
     * used by inpaint
     */
    img2img?: ImageImg2ImgParams;
    legacy?: boolean;
    legacy_v3_extend?: boolean;
    mask?: string;
    n_samples?: number;
    negative_prompt?: string;
    noise?: number;
    noise_schedule?: string;
    params_version?: number;
    prefer_brownian?: boolean;
    prompt?: string;
    qualityToggle?: boolean;
    reference_image?: string;
    reference_image_multiple?: string[];
    reference_information_extracted?: number;
    reference_information_extracted_multiple?: number[];
    reference_strength?: number;
    reference_strength_multiple?: number[];
    sampler?: string;
    scale?: number;
    seed?: number;
    /**
     * (Summer Sampler update) triggers Variety Boost
     */
    skip_cfg_above_sigma?: number;
    sm?: boolean;
    sm_dyn?: boolean;
    steps?: number;
    stream?: "msgpack" | "sse";
    strength?: number;
    ucPreset?: number;
    v4_negative_prompt?: ImageV4ConditionInput;
    v4_prompt?: ImageV4ConditionInput;
    width?: number;
}

interface ImageV4ConditionInput {
    caption?: ImageV4ExternalCaption;
    legacy_uc?: boolean;
    use_coords?: boolean;
    use_order?: boolean;
}

interface ImageV4ExternalCaption {
    base_caption?: string;
    char_captions?: ImageV4ExternalCharacterCaption[];
}

interface ImageV4ExternalCharacterCaption {
    centers?: ImageCoordinates[];
    char_caption?: string;
}
