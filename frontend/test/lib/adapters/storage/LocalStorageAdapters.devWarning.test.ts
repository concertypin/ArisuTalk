// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, onTestFinished, vi } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { LocalStorageChatAdapter } from "@/lib/adapters/storage/chat/LocalStorageChatAdapter";
import { LocalStorageCharacterAdapter } from "@/lib/adapters/storage/character/LocalStorageCharacterAdapter";
import { LocalStoragePersonaAdapter } from "@/lib/adapters/storage/persona/LocalStoragePersonaAdapter";
import { LocalStorageSettingsAdapter } from "@/lib/adapters/storage/settings/LocalStorageSettingsAdapter";

type InitAdapter = { init(): Promise<void> };
type Case = { name: string; create: () => InitAdapter };

const cases: Case[] = [
    { name: "LocalStorageChatAdapter", create: () => new LocalStorageChatAdapter() },
    { name: "LocalStorageCharacterAdapter", create: () => new LocalStorageCharacterAdapter() },
    { name: "LocalStoragePersonaAdapter", create: () => new LocalStoragePersonaAdapter() },
    { name: "LocalStorageSettingsAdapter", create: () => new LocalStorageSettingsAdapter() },
];

describe("LocalStorage adapters: development-only warning on init", () => {
    let logs: AnyLogEntry[];
    let detach: () => void;

    beforeEach(() => {
        logs = [];
        detach = Logger.onLog((entry) => logs.push(entry));
    });

    afterEach(() => {
        detach();
    });

    describe.each(cases)("$name", ({ name, create }) => {
        it("warns that it is for development/testing only outside dev mode", async () => {
            vi.stubEnv("DEV", false);
            onTestFinished(() => {
                vi.unstubAllEnvs();
            });

            await create().init();

            const warnings = logs.filter((entry) => entry.level === "warn");
            expect(warnings).toHaveLength(1);
            expect(warnings[0].message).toContain(name);
            expect(warnings[0].message).toContain("development/testing");
        });

        it("stays silent in dev mode", async () => {
            vi.stubEnv("DEV", true);
            onTestFinished(() => {
                vi.unstubAllEnvs();
            });

            await create().init();

            expect(logs.filter((entry) => entry.level === "warn")).toEqual([]);
        });
    });
});
