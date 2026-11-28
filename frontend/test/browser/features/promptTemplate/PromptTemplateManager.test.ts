import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import PromptTemplateManager from "@/features/promptTemplate/components/PromptTemplateManager.svelte";
import { promptTemplateStore } from "@/features/promptTemplate/stores/promptTemplateStore.svelte";
import type { PromptTemplate } from "@/features/promptTemplate";
import { estimateTokens } from "@/lib/utils/tokenCounter";
import { Logger } from "@common/logger/Logger";
import { fillText } from "@test/utils/user";

type Prompts = PromptTemplate["prompts"];

/** Replaces the store's content with the given templates, bypassing the UI. */
async function resetStore(
    ...templates: Array<Pick<PromptTemplate, "name" | "description"> & { prompts: Prompts }>
) {
    await promptTemplateStore.initPromise;
    for (const id of promptTemplateStore.templates.map((template) => template.id)) {
        await promptTemplateStore.delete(id);
    }
    for (const template of templates) await promptTemplateStore.create(template);
}

const roleplay = {
    name: "롤플레이",
    description: "이야기용",
    prompts: {
        system: "당신은 기사입니다.",
        generation: "역할을 유지하세요.",
        lore: "왕국의 설정.",
    },
};
const minimal = {
    name: "최소",
    description: "",
    prompts: { system: "", generation: "짧게 답하세요." },
};

describe("PromptTemplateManager", () => {
    beforeEach(async () => {
        await resetStore();
        vi.spyOn(Logger, "error").mockImplementation(() => {});
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        promptTemplateStore.loaded = true;
        await resetStore();
    });

    describe("template list", () => {
        it("shows no list or empty state until the store has loaded", async () => {
            promptTemplateStore.loaded = false;
            render(PromptTemplateManager);

            expect(screen.queryByText("No saved prompt templates yet.")).not.toBeInTheDocument();

            promptTemplateStore.loaded = true;
            await screen.findByText("No saved prompt templates yet.");
        });

        it("explains that there are no templates when the list is empty", async () => {
            render(PromptTemplateManager);

            await screen.findByText("No saved prompt templates yet.");
        });

        it("lists each template with its name and description", async () => {
            await resetStore(roleplay, minimal);
            render(PromptTemplateManager);

            screen.getByRole("heading", { name: "롤플레이" });
            screen.getByRole("heading", { name: "최소" });
            screen.getByText("이야기용");
        });

        it("marks which prompts each template defines", async () => {
            await resetStore(roleplay, minimal);
            render(PromptTemplateManager);

            // One mark per template and prompt, in template order.
            const marks = (kind: string) =>
                screen.getAllByText(new RegExp(`^${kind}: `)).map((mark) => mark.textContent);
            expect(marks("system")).toEqual(["system: ✓", "system: —"]);
            expect(marks("generation")).toEqual(["generation: ✓", "generation: ✓"]);
            expect(marks("lore")).toEqual(["lore: ✓", "lore: —"]);
        });
    });

    describe("applying", () => {
        it("passes the template's prompts to onApply", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay, minimal);
            const onApply = vi.fn<(prompts: Prompts) => void>();
            render(PromptTemplateManager, { props: { onApply } });

            await user.click(screen.getAllByRole("button", { name: "Apply template" })[1]);

            expect(onApply).toHaveBeenCalledExactlyOnceWith(minimal.prompts);
        });

        it("does not fail when no onApply callback was provided", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "Apply template" }));

            screen.getByRole("heading", { name: "롤플레이" });
        });
    });

    describe("creating", () => {
        it("opens an empty form with the save button disabled", async () => {
            const user = userEvent.setup();
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "New Template" }));

            screen.getByRole("dialog", { name: "New template" });
            expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
            expect(screen.getByRole("button", { name: "Save Template" })).toBeDisabled();
        });

        it("keeps saving disabled while the name is only whitespace", async () => {
            const user = userEvent.setup();
            render(PromptTemplateManager);
            await user.click(screen.getByRole("button", { name: "New Template" }));

            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "   ");

            expect(screen.getByRole("button", { name: "Save Template" })).toBeDisabled();
        });

        it("pre-fills the prompts from currentPrompts", async () => {
            const user = userEvent.setup();
            render(PromptTemplateManager, {
                props: { currentPrompts: { system: "현재 설명", generation: "현재 지시문" } },
            });

            await user.click(screen.getByRole("button", { name: "New Template" }));

            expect(
                screen.getByRole("textbox", { name: "Character Description Prompt" })
            ).toHaveValue("현재 설명");
            expect(
                screen.getByRole("textbox", { name: "Generation / Instruction Prompt" })
            ).toHaveValue("현재 지시문");
            expect(
                screen.getByRole("textbox", { name: "Lore / Author's Note (optional)" })
            ).toHaveValue("");
        });

        it("updates the token estimate of each prompt as the user types", async () => {
            const user = userEvent.setup();
            render(PromptTemplateManager);
            await user.click(screen.getByRole("button", { name: "New Template" }));
            const text = "가나다".repeat(10);

            await fillText(
                user,
                screen.getByRole("textbox", { name: "Character Description Prompt" }),
                text
            );

            screen.getByText(`~${estimateTokens(text)} tokens`);
            // The other two prompts are still empty.
            expect(screen.getAllByText("~0 tokens")).toHaveLength(2);
        });

        it("saves the template with trimmed name and description, then closes the form", async () => {
            const user = userEvent.setup();
            render(PromptTemplateManager);
            await user.click(screen.getByRole("button", { name: "New Template" }));

            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "  내 템플릿  ");
            await fillText(
                user,
                screen.getByRole("textbox", { name: "Description (optional)" }),
                "  설명입니다  "
            );
            await fillText(
                user,
                screen.getByRole("textbox", { name: "Character Description Prompt" }),
                "해적이 되세요"
            );
            await fillText(
                user,
                screen.getByRole("textbox", { name: "Generation / Instruction Prompt" }),
                "아르르"
            );
            await user.click(screen.getByRole("button", { name: "Save Template" }));

            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            screen.getByRole("heading", { name: "내 템플릿" });
            expect(promptTemplateStore.templates).toHaveLength(1);
            expect(promptTemplateStore.templates[0]).toMatchObject({
                name: "내 템플릿",
                description: "설명입니다",
                prompts: { system: "해적이 되세요", generation: "아르르" },
            });
        });

        it("starts the next new template blank after a previous one was saved", async () => {
            const user = userEvent.setup();
            render(PromptTemplateManager, {
                props: { currentPrompts: { system: "", generation: "" } },
            });
            await user.click(screen.getByRole("button", { name: "New Template" }));
            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "첫째");
            await user.click(screen.getByRole("button", { name: "Save Template" }));
            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

            await user.click(screen.getByRole("button", { name: "New Template" }));

            expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
        });

        it("keeps the form open and logs when saving fails", async () => {
            const user = userEvent.setup();
            vi.spyOn(promptTemplateStore, "create").mockRejectedValue(new Error("quota exceeded"));
            render(PromptTemplateManager);
            await user.click(screen.getByRole("button", { name: "New Template" }));
            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "실패할 템플릿");

            await user.click(screen.getByRole("button", { name: "Save Template" }));

            await vi.waitFor(() =>
                expect(Logger.error).toHaveBeenCalledWith(
                    "Failed to save prompt template",
                    expect.any(Error)
                )
            );
            screen.getByRole("dialog", { name: "New template" });
            expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("실패할 템플릿");
        });
    });

    describe("closing the form without saving", () => {
        async function openForm() {
            const user = userEvent.setup();
            render(PromptTemplateManager);
            await user.click(screen.getByRole("button", { name: "New Template" }));
            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "저장 안 함");
            return user;
        }

        it("closes with Cancel and keeps nothing", async () => {
            const user = await openForm();

            await user.click(screen.getByRole("button", { name: "Cancel" }));

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            expect(promptTemplateStore.templates).toHaveLength(0);
        });

        it("closes with the close button", async () => {
            const user = await openForm();

            await user.click(screen.getByRole("button", { name: "Close" }));

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            expect(promptTemplateStore.templates).toHaveLength(0);
        });

        it("closes when Escape is pressed inside the dialog", async () => {
            const user = await openForm();

            await user.click(screen.getByRole("textbox", { name: "Name" }));
            await user.keyboard("{Escape}");

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("closes when the backdrop is clicked but not when the dialog itself is", async () => {
            const user = await openForm();

            await user.click(screen.getByRole("heading", { name: "New Template" }));
            screen.getByRole("dialog");

            await user.click(screen.getByRole("presentation"));

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("forgets the typed values when the form is reopened", async () => {
            const user = await openForm();
            await user.click(screen.getByRole("button", { name: "Cancel" }));

            await user.click(screen.getByRole("button", { name: "New Template" }));

            expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
        });
    });

    describe("editing", () => {
        it("opens the form filled with the template and a save-changes button", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "Edit template" }));

            screen.getByRole("dialog", { name: "Edit template" });
            expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("롤플레이");
            expect(screen.getByRole("textbox", { name: "Description (optional)" })).toHaveValue(
                "이야기용"
            );
            expect(
                screen.getByRole("textbox", { name: "Character Description Prompt" })
            ).toHaveValue("당신은 기사입니다.");
            expect(
                screen.getByRole("textbox", { name: "Lore / Author's Note (optional)" })
            ).toHaveValue("왕국의 설정.");
            expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
        });

        it("updates the existing template instead of adding a new one", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay, minimal);
            render(PromptTemplateManager);
            const idBefore = promptTemplateStore.templates[0].id;

            await user.click(screen.getAllByRole("button", { name: "Edit template" })[0]);
            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "새 이름");
            await fillText(
                user,
                screen.getByRole("textbox", { name: "Generation / Instruction Prompt" }),
                "새 지시문"
            );
            await user.click(screen.getByRole("button", { name: "Save Changes" }));

            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            screen.getByRole("heading", { name: "새 이름" });
            expect(promptTemplateStore.templates).toHaveLength(2);
            expect(promptTemplateStore.templates[0]).toMatchObject({
                id: idBefore,
                name: "새 이름",
                prompts: { system: "당신은 기사입니다.", generation: "새 지시문" },
            });
            expect(promptTemplateStore.templates[1].name).toBe("최소");
        });

        it("does not touch the stored template while the edit is unsaved", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            render(PromptTemplateManager);
            await user.click(screen.getByRole("button", { name: "Edit template" }));

            await fillText(user, screen.getByRole("textbox", { name: "Name" }), "초안 이름");
            await user.click(screen.getByRole("button", { name: "Cancel" }));

            expect(promptTemplateStore.templates[0].name).toBe("롤플레이");
            screen.getByRole("heading", { name: "롤플레이" });
        });
    });

    describe("deleting", () => {
        it("removes only the chosen template", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay, minimal);
            render(PromptTemplateManager);

            await user.click(screen.getAllByRole("button", { name: "Delete template" })[0]);

            await waitFor(() =>
                expect(screen.queryByRole("heading", { name: "롤플레이" })).not.toBeInTheDocument()
            );
            screen.getByRole("heading", { name: "최소" });
            expect(promptTemplateStore.templates.map((t) => t.name)).toEqual(["최소"]);
        });

        it("shows the empty state after the last template is deleted", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "Delete template" }));

            await screen.findByText("No saved prompt templates yet.");
        });

        it("keeps the template and logs when deletion fails", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            vi.spyOn(promptTemplateStore, "delete").mockRejectedValue(new Error("db locked"));
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "Delete template" }));

            await vi.waitFor(() =>
                expect(Logger.error).toHaveBeenCalledWith(
                    "Failed to delete prompt template",
                    expect.any(Error)
                )
            );
            screen.getByRole("heading", { name: "롤플레이" });
        });
    });

    describe("previewing", () => {
        it("shows the name, description and every prompt of the template", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "Preview" }));

            const dialog = screen.getByRole("dialog", { name: "Preview template" });
            within(dialog).getByText("이야기용");
            screen.getByText("당신은 기사입니다.");
            screen.getByText("역할을 유지하세요.");
            screen.getByText("왕국의 설정.");
        });

        it("marks missing prompts as empty and leaves out the absent lore and description", async () => {
            const user = userEvent.setup();
            await resetStore(minimal);
            render(PromptTemplateManager);

            await user.click(screen.getByRole("button", { name: "Preview" }));

            const dialog = screen.getByRole("dialog", { name: "Preview template" });
            within(dialog).getByText("짧게 답하세요.");
            expect(within(dialog).getAllByText("(empty)")).toHaveLength(1);
            expect(
                within(dialog).queryByText("Description", { exact: true })
            ).not.toBeInTheDocument();
            expect(within(dialog).queryByText("Lore / Author's Note")).not.toBeInTheDocument();
        });

        it("applies the template from the preview and closes it", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            const onApply = vi.fn<(prompts: Prompts) => void>();
            render(PromptTemplateManager, { props: { onApply } });
            await user.click(screen.getByRole("button", { name: "Preview" }));

            const preview = screen.getByRole("dialog", { name: "Preview template" });
            await user.click(within(preview).getByRole("button", { name: "Apply Template" }));

            expect(onApply).toHaveBeenCalledExactlyOnceWith(roleplay.prompts);
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("closes with the Close button, the X button, Escape and the backdrop", async () => {
            const user = userEvent.setup();
            await resetStore(roleplay);
            render(PromptTemplateManager);
            const previewDialog = () => screen.queryByRole("dialog", { name: "Preview template" });

            await user.click(screen.getByRole("button", { name: "Preview" }));
            await user.click(screen.getByRole("button", { name: "Close" }));
            expect(previewDialog()).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Preview" }));
            await user.click(screen.getByRole("button", { name: "Close preview" }));
            expect(previewDialog()).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Preview" }));
            await user.click(screen.getByRole("heading", { name: "롤플레이", level: 3 }));
            await user.keyboard("{Escape}");
            expect(previewDialog()).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Preview" }));
            await user.click(screen.getByRole("presentation"));
            expect(previewDialog()).not.toBeInTheDocument();
        });
    });
});
