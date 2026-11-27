import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import AdvancedSettings from "@/components/settingSubpage/AdvancedSettings.svelte";

const migration = vi.hoisted(() => ({
    exportDataAsBlob: vi.fn<() => Promise<Blob>>(),
    parseBackupFile: vi.fn<(file: File) => Promise<{ data: Record<string, unknown[]> }>>(),
    importBackup: vi.fn<(backup: { data: Record<string, unknown[]> }) => Promise<void>>(),
    markSchemaMigrated: vi.fn<() => void>(),
}));

// The database layer behind the backup is not under test here; the component's own behavior is:
// what it does with a blob or a chosen file, and what the user is told.
vi.mock("@/lib/migration/storageMigration", () => migration);

describe("AdvancedSettings", () => {
    afterEach(() => {
        vi.restoreAllMocks();
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
    });
});
