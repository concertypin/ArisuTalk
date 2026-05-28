// worker.ts

import { expose } from "comlink";
import { createLogBridgeSender, type LogBridgeReceiver } from "@common/logger/LogBridge";
import { parseCharacter } from "@worker/cardparse/parse";
import { exportCharacter } from "@worker/cardparse/encode";
import { setLogger } from "@worker/cardparse/shared";

declare global {
    // Nodejs Buffer extends Uint8Array
    type Buffer = Uint8Array<ArrayBuffer>;
}
// exported for main ui's type inference
export const api = {
    parseCharacter,
    exportCharacter,
    setLogReceiver(receiver: LogBridgeReceiver) {
        setLogger(createLogBridgeSender(receiver)).info("Card parse worker connected to telemetry");
    },
};

expose(api);
