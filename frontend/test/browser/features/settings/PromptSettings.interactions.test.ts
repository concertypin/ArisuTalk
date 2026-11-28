import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import PromptSettings from "@/components/settingSubpage/PromptSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { promptTemplateStore } from "@/features/promptTemplate/stores/promptTemplateStore.svelte";
import { fillText } from "@test/utils/user";

const SECTION_LABELS = ["System Prompt", "Character", "Persona", "Lore"] as const;

/** Replaces the saved templates with the given ones. */
async function resetTemplates(
    ...templates: Array<Parameters<typeof promptTemplateStore.create>[0]>
) {
    await promptTemplateStore.initPromise;
    for (const id of promptTemplateStore.templates.map((template) => template.id)) {
        await promptTemplateStore.delete(id);
    }
    for (const template of templates) await promptTemplateStore.create(template);
}

describe("PromptSettings interactions", () => {
    beforeEach(async () => {
        settings.value = SettingsSchema.parse({});
        vi.spyOn(settings, "save").mockResolvedValue(undefined);
        await resetTemplates();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await resetTemplates();
    });

    describe("system prompt", () => {
        it("shows the stored generation prompt and writes edits back to the settings", async () => {
            const user = userEvent.setup();
            settings.value.prompt.generationPrompt = "친절하게 답하세요.";
            render(PromptSettings);
            const textbox = screen.getByRole("textbox");
            expect(textbox).toHaveValue("친절하게 답하세요.");

            await fillText(user, textbox, "간결하게 답하세요.");

            expect(settings.value.prompt.generationPrompt).toBe("간결하게 답하세요.");
        });
    });

    describe("prompt sections", () => {
        it("shows every section as enabled when there are no overrides", () => {
            render(PromptSettings);

            for (const label of SECTION_LABELS) {
                expect(screen.getByRole("checkbox", { name: label })).toBeChecked();
            }
        });

        it("reflects a stored override for one section only", () => {
            settings.value.prompt.promptSections = [{ key: "persona", enabled: false }];
            render(PromptSettings);

            expect(screen.getByRole("checkbox", { name: "Persona" })).not.toBeChecked();
            expect(screen.getByRole("checkbox", { name: "Character" })).toBeChecked();
        });

        it("disables a section, stores the override and saves the settings", async () => {
            const user = userEvent.setup();
            render(PromptSettings);

            await user.click(screen.getByRole("checkbox", { name: "Character" }));

            expect(settings.value.prompt.promptSections).toEqual([
                { key: "character", enabled: false },
            ]);
            expect(settings.save).toHaveBeenCalledOnce();
            expect(screen.getByRole("checkbox", { name: "Character" })).not.toBeChecked();
        });

        it("re-enables a disabled section by updating its override, not adding a second one", async () => {
            const user = userEvent.setup();
            settings.value.prompt.promptSections = [
                { key: "lore", enabled: false },
                { key: "character", enabled: false },
            ];
            render(PromptSettings);

            await user.click(screen.getByRole("checkbox", { name: "Character" }));

            expect(settings.value.prompt.promptSections).toEqual([
                { key: "lore", enabled: false },
                { key: "character", enabled: true },
            ]);
            expect(screen.getByRole("checkbox", { name: "Character" })).toBeChecked();
            expect(screen.getByRole("checkbox", { name: "Lore" })).not.toBeChecked();
        });

        it("keeps overrides of other sections when one is toggled", async () => {
            const user = userEvent.setup();
            render(PromptSettings);

            await user.click(screen.getByRole("checkbox", { name: "Persona" }));
            await user.click(screen.getByRole("checkbox", { name: "Lore" }));

            expect(settings.value.prompt.promptSections).toEqual([
                { key: "persona", enabled: false },
                { key: "lore", enabled: false },
            ]);
            expect(settings.save).toHaveBeenCalledTimes(2);
        });

        it("warns that no system prompt is sent only while every section is disabled", async () => {
            const user = userEvent.setup();
            render(PromptSettings);
            const warning = "All sections are disabled. The LLM will receive no system prompt.";
            expect(screen.queryByText(warning)).not.toBeInTheDocument();

            await user.click(screen.getByRole("checkbox", { name: "System Prompt" }));
            await user.click(screen.getByRole("checkbox", { name: "Character" }));
            await user.click(screen.getByRole("checkbox", { name: "Persona" }));
            expect(screen.queryByText(warning)).not.toBeInTheDocument();
            await user.click(screen.getByRole("checkbox", { name: "Lore" }));
            screen.getByText(warning);

            await user.click(screen.getByRole("checkbox", { name: "Lore" }));
            expect(screen.queryByText(warning)).not.toBeInTheDocument();
        });
    });

    describe("template manager", () => {
        it("is hidden until requested, and can be hidden again", async () => {
            const user = userEvent.setup();
            render(PromptSettings);
            expect(
                screen.queryByRole("heading", { name: "Prompt Templates" })
            ).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Load Template" }));
            await screen.findByRole("heading", { name: "Prompt Templates" });

            await user.click(screen.getByRole("button", { name: "Hide Templates" }));
            expect(
                screen.queryByRole("heading", { name: "Prompt Templates" })
            ).not.toBeInTheDocument();
            screen.getByRole("button", { name: "Load Template" });
        });

        it("applies a template's generation prompt to the settings and saves", async () => {
            const user = userEvent.setup();
            await resetTemplates({
                name: "간결",
                description: "",
                prompts: { system: "여기서는 무시됨", generation: "한 줄로 답하세요." },
            });
            render(PromptSettings);
            await user.click(screen.getByRole("button", { name: "Load Template" }));

            await user.click(await screen.findByRole("button", { name: "Apply template" }));

            expect(settings.value.prompt.generationPrompt).toBe("한 줄로 답하세요.");
            expect(settings.save).toHaveBeenCalledOnce();
            expect(screen.getAllByRole("textbox")[0]).toHaveValue("한 줄로 답하세요.");
        });

        it("keeps the current prompt when the applied template has no generation prompt", async () => {
            const user = userEvent.setup();
            settings.value.prompt.generationPrompt = "그대로 두세요.";
            await resetTemplates({
                name: "시스템만",
                description: "",
                prompts: { system: "어떤 시스템 문구", generation: "" },
            });
            render(PromptSettings);
            await user.click(screen.getByRole("button", { name: "Load Template" }));

            await user.click(await screen.findByRole("button", { name: "Apply template" }));

            expect(settings.value.prompt.generationPrompt).toBe("그대로 두세요.");
        });

        it("pre-fills a new template with the current generation prompt", async () => {
            const user = userEvent.setup();
            settings.value.prompt.generationPrompt = "현재 지시문";
            render(PromptSettings);
            await user.click(screen.getByRole("button", { name: "Load Template" }));

            await user.click(await screen.findByRole("button", { name: "New Template" }));

            expect(
                screen.getByRole("textbox", { name: "Generation / Instruction Prompt" })
            ).toHaveValue("현재 지시문");
        });
    });
});
