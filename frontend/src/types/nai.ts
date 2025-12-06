export interface NAIGenerationItem {
    title?: string;
    emotion: string;
    action: string;
    titleKey?: string;
    [key: string]: any;
}

export interface NAISettings {
    apiKey: string;
    model: string;
    preferredSize: string;
    steps: number;
    scale: number;
    sampler: string;
    minDelay: number;
    maxAdditionalDelay: number;
    autoGenerate: boolean;
    noise_schedule?: string;
    useCharacterPrompts?: boolean;
    vibeTransferEnabled?: boolean;
    vibeTransferStrength?: number;
    vibeTransferInformationExtracted?: number;
    sm?: boolean;
    sm_dyn?: boolean;
    cfg_rescale?: number;
    uncond_scale?: number;
    dynamic_thresholding?: boolean;
    dynamic_thresholding_percentile?: number;
    dynamic_thresholding_mimic_scale?: number;
    legacy?: boolean;
    add_original_image?: boolean;
    naiGenerationList?: NAIGenerationItem[];
    [key: string]: any;
}
