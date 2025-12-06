import { derived } from "svelte/store";
import { persistentStore } from "./persistentStore";
import { defaultAPISettings } from "../../defaults";

export interface Settings {
    apiKey: string; // Legacy
    model: string;
    apiProvider: string;
    apiConfigs: Record<string, any>;
    userName: string;
    userDescription: string;
    proactiveChatEnabled: boolean;
    randomFirstMessageEnabled: boolean;
    randomCharacterCount: number;
    randomMessageFrequencyMin: number;
    randomMessageFrequencyMax: number;
    snapshotsEnabled: boolean;
    enableDebugLogs: boolean;
    experimentalFeaturesEnabled: boolean;
    experimentalTracingEnabled: boolean;
    fontScale: number;
    naiSettings: {
        apiKey: string;
        model: string;
        preferredSize: string;
        steps: number;
        scale: number;
        sampler: string;
        minDelay: number;
        maxAdditionalDelay: number;
        autoGenerate: boolean;
        [key: string]: any;
    };
    [key: string]: any;
}

const initialSettings: Settings = {
    apiKey: "", // Legacy
    model: "gemini-2.5-flash",
    ...defaultAPISettings,
    userName: "",
    userDescription: "",
    proactiveChatEnabled: false,
    randomFirstMessageEnabled: false,
    randomCharacterCount: 3,
    randomMessageFrequencyMin: 10,
    randomMessageFrequencyMax: 120,
    snapshotsEnabled: true,
    enableDebugLogs: false,
    experimentalFeaturesEnabled: false,
    experimentalTracingEnabled: false,
    fontScale: 1,
    naiSettings: {
        apiKey: "",
        model: "nai-diffusion-4-5-full",
        preferredSize: "square",
        steps: 28,
        scale: 3,
        sampler: "k_euler_ancestral",
        minDelay: 20000,
        maxAdditionalDelay: 10000,
        autoGenerate: true,
    },
};

export const settings = persistentStore<Settings>(
    "personaChat_settings_v16",
    initialSettings
);

export const experimentalFeaturesOptIn = derived(settings, ($settings) =>
    Boolean($settings?.experimentalFeaturesEnabled)
);

export const experimentalTracingOptIn = derived(settings, ($settings) =>
    Boolean($settings?.experimentalTracingEnabled)
);
export interface SettingsSnapshot {
    timestamp: number;
    settings: Settings;
    metadata: {
        createdAt: string;
        version: string;
    };
}

export const settingsSnapshots = persistentStore<SettingsSnapshot[]>(
    "personaChat_settingsSnapshots_v16",
    []
);
