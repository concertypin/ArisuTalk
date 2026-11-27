import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import AdvancedSettings from "@/components/settingSubpage/AdvancedSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { toastStore } from "@/lib/stores/toast.svelte";
import { versionInfo, type VersionInfo } from "@/lib/stores/versionInfo.svelte";
import { Logger } from "@common/logger/Logger";

const migration = vi.hoisted(() => ({
    exportDataAsBlob: vi.fn<() => Promise<Blob>>(),
    parseBackupFile: vi.fn<(file: File) => Promise<{ data: Record<string, unknown[]> }>>(),
    importBackup: vi.fn<(backup: { data: Record<string, unknown[]> }) => Promise<void>>(),
    markSchemaMigrated: vi.fn<() => void>(),
}));

// The database layer behind the backup is not under test here; the component's own behavior is:
// what it does with a blob or a chosen file, and what the user is told.
vi.mock("@/lib/migration/storageMigration", () => migration);

/** Removes every toast so assertions only see what the current test caused. */
function clearToasts() {
    for (const id of toastStore.toasts.map((toast) => toast.id)) toastStore.dismiss(id);
}

describe("AdvancedSettings", () => {
    beforeEach(() => {
        settings.value = SettingsSchema.parse({});
        vi.spyOn(Logger, "error").mockImplementation(() => {});
        migration.exportDataAsBlob.mockReset();
        migration.parseBackupFile.mockReset();
        migration.importBackup.mockReset();
        migration.markSchemaMigrated.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        clearToasts();
    });

    describe("feature toggles", () => {
        it("reflects the stored debug and experimental flags", () => {
            settings.value.advanced.debug = true;
            render(AdvancedSettings);

            expect(screen.getByRole("checkbox", { name: "Debug Mode" })).toBeChecked();
            expect(
                screen.getByRole("checkbox", { name: "Experimental Features" })
            ).not.toBeChecked();
        });

        it("writes the debug toggle back to the settings", async () => {
            const user = userEvent.setup();
            render(AdvancedSettings);

            await user.click(screen.getByRole("checkbox", { name: "Debug Mode" }));
            expect(settings.value.advanced.debug).toBe(true);

            await user.click(screen.getByRole("checkbox", { name: "Debug Mode" }));
            expect(settings.value.advanced.debug).toBe(false);
        });

        it("writes the experimental toggle back without touching debug", async () => {
            const user = userEvent.setup();
            render(AdvancedSettings);

            await user.click(screen.getByRole("checkbox", { name: "Experimental Features" }));

            expect(settings.value.advanced.experimental).toBe(true);
            expect(settings.value.advanced.debug).toBe(false);
        });
    });

    describe("export", () => {
        // The anchors the component clicked, in order. A real click would start a download.
        const clickedAnchors: HTMLAnchorElement[] = [];

        beforeEach(() => {
            clickedAnchors.length = 0;
            vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
                this: HTMLAnchorElement
            ) {
                clickedAnchors.push(this);
            });
            vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:backup-url");
            vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        });

        it("downloads the backup as a dated .aribackup file", async () => {
            const user = userEvent.setup();
            const blob = new Blob(["backup bytes"]);
            migration.exportDataAsBlob.mockResolvedValue(blob);
            render(AdvancedSettings);

            await user.click(screen.getByRole("button", { name: "Export All Data" }));

            await waitFor(() => expect(clickedAnchors).toHaveLength(1));
            expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
            const [anchor] = clickedAnchors;
            expect(anchor.href).toBe("blob:backup-url");
            const today = new Date().toISOString().slice(0, 10);
            expect(anchor.download).toBe(`arisutalk-backup-${today}.aribackup`);
        });

        it("releases the temporary blob URL after starting the download", async () => {
            const user = userEvent.setup();
            migration.exportDataAsBlob.mockResolvedValue(new Blob(["x"]));
            render(AdvancedSettings);

            await user.click(screen.getByRole("button", { name: "Export All Data" }));

            await waitFor(() =>
                expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:backup-url")
            );
        });

        it("shows a busy, disabled button while the export is being prepared", async () => {
            const user = userEvent.setup();
            const pending = Promise.withResolvers<Blob>();
            migration.exportDataAsBlob.mockReturnValue(pending.promise);
            render(AdvancedSettings);

            await user.click(screen.getByRole("button", { name: "Export All Data" }));

            expect(await screen.findByRole("button", { name: "Exporting..." })).toBeDisabled();

            pending.resolve(new Blob(["x"]));
            expect(await screen.findByRole("button", { name: "Export All Data" })).toBeEnabled();
        });

        it("tells the user and logs when the export fails, then lets them retry", async () => {
            const user = userEvent.setup();
            migration.exportDataAsBlob.mockRejectedValue(new Error("db locked"));
            render(AdvancedSettings);

            await user.click(screen.getByRole("button", { name: "Export All Data" }));

            expect(await screen.findByRole("button", { name: "Export All Data" })).toBeEnabled();
            expect(toastStore.toasts.map((t) => [t.type, t.message])).toEqual([
                ["error", "Failed to export data"],
            ]);
            expect(Logger.error).toHaveBeenCalledWith("Export failed", expect.any(Error));
            expect(clickedAnchors).toEqual([]);
        });
    });

    describe("import", () => {
        // Opening the native file chooser is not possible in a test; capturing the created
        // input lets the test play the part of the user choosing a file.
        const clickedInputs: HTMLInputElement[] = [];

        beforeEach(() => {
            clickedInputs.length = 0;
            vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function (
                this: HTMLInputElement
            ) {
                clickedInputs.push(this);
            });
        });

        /** Clicks "Import Data" and returns the file input the component opened. */
        async function openFileChooser(user: ReturnType<typeof userEvent.setup>) {
            await user.click(screen.getByRole("button", { name: "Import Data" }));
            await waitFor(() => expect(clickedInputs).toHaveLength(1));
            return clickedInputs[0];
        }

        it("opens a file chooser limited to backup files", async () => {
            const user = userEvent.setup();
            render(AdvancedSettings);

            const input = await openFileChooser(user);

            expect(input.type).toBe("file");
            expect(input.accept).toBe(".aribackup,.json");
        });

        it("parses and imports the chosen file, then asks the user to reload", async () => {
            const user = userEvent.setup();
            const backup = { data: { chats: [{ id: "c1" }] } };
            migration.parseBackupFile.mockResolvedValue(backup);
            migration.importBackup.mockResolvedValue(undefined);
            render(AdvancedSettings);
            const input = await openFileChooser(user);
            const file = new File(["bytes"], "my.aribackup");

            await user.upload(input, file);

            await waitFor(() => expect(toastStore.toasts).toHaveLength(1));
            expect(migration.parseBackupFile).toHaveBeenCalledExactlyOnceWith(file);
            expect(migration.importBackup).toHaveBeenCalledExactlyOnceWith(backup);
            expect(migration.markSchemaMigrated).toHaveBeenCalledOnce();
            expect(toastStore.toasts[0]).toMatchObject({
                type: "success",
                message: "Data imported successfully. Please reload the page.",
            });
        });

        it("only marks the schema migrated after the import itself has finished", async () => {
            const user = userEvent.setup();
            const finish = Promise.withResolvers<void>();
            migration.parseBackupFile.mockResolvedValue({ data: {} });
            migration.importBackup.mockReturnValue(finish.promise);
            render(AdvancedSettings);
            const input = await openFileChooser(user);

            await user.upload(input, new File(["bytes"], "my.aribackup"));

            expect(await screen.findByRole("button", { name: "Importing..." })).toBeDisabled();
            expect(migration.markSchemaMigrated).not.toHaveBeenCalled();

            finish.resolve();
            expect(await screen.findByRole("button", { name: "Import Data" })).toBeEnabled();
            expect(migration.markSchemaMigrated).toHaveBeenCalledOnce();
        });

        it("does nothing when the chooser is closed without picking a file", async () => {
            const user = userEvent.setup();
            render(AdvancedSettings);
            const input = await openFileChooser(user);

            await fireEvent.change(input);

            expect(screen.getByRole("button", { name: "Import Data" })).toBeEnabled();
            expect(migration.parseBackupFile).not.toHaveBeenCalled();
            expect(toastStore.toasts).toHaveLength(0);
        });

        it("reports an unreadable backup and does not import or mark the migration done", async () => {
            const user = userEvent.setup();
            migration.parseBackupFile.mockRejectedValue(new Error("not a backup"));
            render(AdvancedSettings);
            const input = await openFileChooser(user);

            await user.upload(input, new File(["garbage"], "bad.json"));

            await waitFor(() => expect(toastStore.toasts).toHaveLength(1));
            expect(toastStore.toasts[0]).toMatchObject({
                type: "error",
                message: "Failed to import data",
            });
            expect(Logger.error).toHaveBeenCalledWith("Import failed", expect.any(Error));
            expect(migration.importBackup).not.toHaveBeenCalled();
            expect(migration.markSchemaMigrated).not.toHaveBeenCalled();
            expect(await screen.findByRole("button", { name: "Import Data" })).toBeEnabled();
        });

        it("reports a failing import and does not mark the migration done", async () => {
            const user = userEvent.setup();
            migration.parseBackupFile.mockResolvedValue({ data: {} });
            migration.importBackup.mockRejectedValue(new Error("constraint violation"));
            render(AdvancedSettings);
            const input = await openFileChooser(user);

            await user.upload(input, new File(["bytes"], "my.aribackup"));

            await waitFor(() => expect(toastStore.toasts).toHaveLength(1));
            expect(toastStore.toasts[0]).toMatchObject({ type: "error" });
            expect(migration.markSchemaMigrated).not.toHaveBeenCalled();
        });
    });

    describe("version information", () => {
        let original: VersionInfo;

        beforeEach(() => {
            original = versionInfo.value;
        });

        afterEach(() => {
            versionInfo.value = original;
        });

        it("shows the version, channel and release link", () => {
            versionInfo.value = {
                version: "1.2.3",
                channel: "prod",
                commit: "",
                url: "https://example.test/releases",
            };
            render(AdvancedSettings);

            screen.getByText("1.2.3");
            screen.getByText("prod", { exact: true });
            const link = screen.getByRole("link", { name: "GitHub Releases" });
            expect(link).toHaveAttribute("href", "https://example.test/releases");
            expect(link).toHaveAttribute("target", "_blank");
            expect(link).toHaveAttribute("rel", "noopener noreferrer");
        });

        it("hides the commit row when no commit hash is known", () => {
            versionInfo.value = { ...versionInfo.value, commit: "" };
            render(AdvancedSettings);

            screen.getByText("Version", { exact: true });
            expect(screen.queryByText("Commit", { exact: true })).not.toBeInTheDocument();
        });

        it("shows the commit hash when one is known", () => {
            versionInfo.value = { ...versionInfo.value, commit: "abc1234" };
            render(AdvancedSettings);

            screen.getByText("Commit", { exact: true });
            screen.getByText("abc1234");
        });
    });
});
