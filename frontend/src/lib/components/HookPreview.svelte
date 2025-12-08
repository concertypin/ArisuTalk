<script lang="ts">
import { t } from "$root/i18n";
import { applyHooksByType } from "../services/replaceHookService";

export let hookType: "input" | "output" | "request" | "display" = "input";

let testInput = "";
let testOutput = "";
let isLoading = false;

async function testHook() {
    if (!testInput.trim()) {
        alert(t("modal.replaceHooks.previewInputRequired"));
        return;
    }

    isLoading = true;
    try {
        // Apply hooks
        const result = await applyHooksByType(testInput, hookType);
        testOutput = result.modified;
    } catch (error) {
        testOutput = `Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
        isLoading = false;
    }
}

function clearTest() {
    testInput = "";
    testOutput = "";
}

function copyOutput() {
    if (testOutput) {
        navigator.clipboard.writeText(testOutput).then(() => {
            alert(t("modal.replaceHooks.previewCopied"));
        });
    }
}
</script>

<div class="hook-preview">
    <h3>{t("modal.replaceHooks.preview")}</h3>

    <div class="preview-section">
        <label>
            <span class="label-text"
                >{t("modal.replaceHooks.previewInput")}</span
            >
            <textarea
                class="input-textarea"
                placeholder={t("modal.replaceHooks.previewInputPlaceholder")}
                bind:value={testInput}
                rows="4"
            ></textarea>
        </label>
    </div>

    <div class="preview-actions">
        <button class="btn-test" on:click={testHook} disabled={isLoading}>
            {isLoading ? t("common.loading") : t("modal.replaceHooks.test")}
        </button>
        <button class="btn-clear" on:click={clearTest}>
            {t("common.clear")}
        </button>
    </div>

    {#if testOutput}
        <div class="preview-section output">
            <label>
                <span class="label-text"
                    >{t("modal.replaceHooks.previewOutput")}</span
                >
                <textarea
                    class="output-textarea"
                    value={testOutput}
                    readonly
                    rows="4"
                ></textarea>
            </label>
            <button class="btn-copy" on:click={copyOutput}>
                📋 {t("modal.replaceHooks.previewCopy")}
            </button>
        </div>
    {/if}
</div>

<style>
    .hook-preview {
        padding: 1rem;
        background: var(--color-bg-secondary, #f5f5f5);
        border-radius: 0.5rem;
        border: 1px solid var(--color-border, #ddd);
    }

    .hook-preview h3 {
        margin: 0 0 1rem 0;
        font-size: 0.95rem;
    }

    .preview-section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 0.8rem;
    }

    .preview-section.output {
        margin-bottom: 0.5rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .label-text {
        font-weight: 500;
        font-size: 0.85rem;
    }

    .input-textarea,
    .output-textarea {
        padding: 0.6rem;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 0.3rem;
        font-family: monospace;
        font-size: 0.85rem;
        resize: vertical;
    }

    .input-textarea:focus {
        outline: none;
        border-color: var(--color-primary, #007bff);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
    }

    .output-textarea {
        background: white;
        color: var(--color-text, #333);
    }

    .preview-actions {
        display: flex;
        gap: 0.6rem;
        margin-bottom: 0.8rem;
    }

    .btn-test,
    .btn-clear,
    .btn-copy {
        padding: 0.5rem 0.8rem;
        border: none;
        border-radius: 0.3rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.85rem;
    }

    .btn-test {
        flex: 1;
        background: var(--color-primary, #007bff);
        color: white;
    }

    .btn-test:hover:not(:disabled) {
        background: var(--color-primary-dark, #0056b3);
    }

    .btn-test:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-clear {
        flex: 1;
        background: var(--color-bg-secondary, #e8e8e8);
        color: var(--color-text, #333);
    }

    .btn-clear:hover {
        background: var(--color-bg-tertiary, #d8d8d8);
    }

    .btn-copy {
        padding: 0.5rem 1rem;
        background: var(--color-success-bg, #d4edda);
        color: var(--color-success, #155724);
        border: 1px solid var(--color-success, #155724);
    }

    .btn-copy:hover {
        background: var(--color-success, #155724);
        color: white;
    }
</style>
