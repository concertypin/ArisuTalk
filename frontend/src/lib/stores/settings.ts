import { derived } from "svelte/store";
import { persistentStore } from "./persistentStore";
import { defaultAPISettings } from "../../defaults";

const initialSettings = {
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
    },
};

export const settings = persistentStore(
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
    settings: any;
    metadata: {
        createdAt: string;
        version: string;
    };
}

export const settingsSnapshots = persistentStore<SettingsSnapshot[]>(
    "personaChat_settingsSnapshots_v16",
    []
);
