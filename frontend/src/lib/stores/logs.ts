import { persistentStore } from "./persistentStore";

export const debugLogs = persistentStore<any[]>("personaChat_debugLogs_v1", []);
