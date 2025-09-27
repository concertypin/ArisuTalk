import { persistentStore } from "./persistentStore";
import { defaultAPISettings } from "../../defaults.js";

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
