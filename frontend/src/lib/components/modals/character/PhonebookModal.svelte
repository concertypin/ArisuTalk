<script lang="ts">
    import { t } from "$root/i18n";
    import { onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { auth } from "../../../stores/auth";
    import type { AuthState } from "../../../stores/auth";
    import { phonebookImportResult } from "../../../stores/character";
    import {
        isPhonebookModalVisible,
        phonebookAccessState,
        type PhonebookAccessState,
    } from "../../../stores/ui";
    import { experimentalTracingOptIn } from "../../../stores/settings";
    import {
        createPhonebookEntry,
        updatePhonebookEntry,
        deletePhonebookEntry,
        verifyPhonebookAccess,
        listPhonebookEntries,
        importPhonebookCharacter,
        type PhonebookEntrySummary,
        type PhonebookEntryInput,
        type PhonebookEntryUpdateInput,
    } from "../../../services/phonebookService";
    import { logUserFlowEvent } from "../../../analytics/userFlow";
    import {
        X,
        Download,
        RefreshCcw,
        ShieldAlert,
        Loader2,
        Plus,
        Pencil,
        Trash2,
        Save,
        Upload,
    } from "@lucide/svelte";

    export let isOpen = false;

    const defaultAuthState: AuthState = {
        status: "idle",
        clerk: null,
        user: null,
        isSignedIn: false,
        error: null,
    };

    let authState: AuthState = defaultAuthState;
    let currentPhonebookAccess: PhonebookAccessState = "unknown";
    let isTracingEnabled = false;
    let entries: PhonebookEntrySummary[] = [];
    let errorMessage = "";
    let isInitializing = false;
    let hasInitialized = false;
    let busyEntryId: string | null = null;

    // Form State
    let isEditing = false;
    let isCreating = false;
    let isSubmitting = false;
    let editTargetId: string | null = null;
    let formName = "";
    let formDescription = "";
    let formEncrypted = false;
    let formFile: File | null = null;
    let formError = "";

    const unsubscribeAuth = auth.subscribe((value) => {
        authState = value ?? defaultAuthState;
    });

    const unsubscribePhonebook = phonebookAccessState.subscribe((value) => {
        currentPhonebookAccess = value;
    });

    const unsubscribeTracing = experimentalTracingOptIn.subscribe((value) => {
        isTracingEnabled = value;
        if (!value) {
            entries = [];
            errorMessage = t("phonebook.experimentalRequired");
            hasInitialized = true;
            isInitializing = false;
            busyEntryId = null;
        }
    });

    onDestroy(() => {
        unsubscribeAuth();
        unsubscribePhonebook();
        unsubscribeTracing();
    });

    const resetState = (): void => {
        entries = [];
        errorMessage = "";
        hasInitialized = false;
        isInitializing = false;
        busyEntryId = null;
        resetForm();
    };

    const resetForm = (): void => {
        isEditing = false;
        isCreating = false;
        isSubmitting = false;
        editTargetId = null;
        formName = "";
        formDescription = "";
        formEncrypted = false;
        formFile = null;
        formError = "";
    };

    const closeModal = (): void => {
        isPhonebookModalVisible.set(false);
        resetState();
    };

    const initialize = async (): Promise<void> => {
        if (isInitializing || hasInitialized) {
            return;
        }
        isInitializing = true;
        errorMessage = "";
        if (!isTracingEnabled) {
            errorMessage = t("phonebook.experimentalRequired");
            void logUserFlowEvent("phonebook_access_blocked", {
                reason: "disabled",
            });
            hasInitialized = true;
            isInitializing = false;
            return;
        }
        try {
            const state = authState;
            void logUserFlowEvent("phonebook_opened", {
                auth_status: state.isSignedIn ? "signed_in" : "guest",
                access_state: currentPhonebookAccess,
            });
            if (!state.isSignedIn || !state.clerk) {
                errorMessage = t("phonebook.signInRequired");
                void logUserFlowEvent("phonebook_access_blocked", {
                    reason: "auth_required",
                });
                return;
            }

            let accessState = currentPhonebookAccess;
            if (accessState === "unknown") {
                const canAccess = await verifyPhonebookAccess(state.clerk);
                phonebookAccessState.set(canAccess ? "enabled" : "disabled");
                accessState = canAccess ? "enabled" : "disabled";
            }

            if (accessState !== "enabled") {
                void logUserFlowEvent("phonebook_access_blocked", {
                    reason: accessState === "disabled" ? "disabled" : "unknown",
                });
                closeModal();
                return;
            }

            const result = await listPhonebookEntries(state.clerk);
            entries = result;
        } catch (error) {
            console.error("Failed to load phonebook entries", error);
            errorMessage =
                error instanceof Error
                    ? error.message
                    : t("phonebook.fetchFailed");
        } finally {
            hasInitialized = true;
            isInitializing = false;
        }
    };

    const handleRetry = async (): Promise<void> => {
        const hadError = errorMessage.length > 0;
        const wasEmpty = !hadError && hasInitialized && entries.length === 0;
        const reason: "error" | "empty" | "manual" = hadError
            ? "error"
            : wasEmpty
              ? "empty"
              : "manual";
        resetState();
        void logUserFlowEvent("phonebook_retry", { reason });
        await initialize();
    };

    const handleImport = async (
        entry: PhonebookEntrySummary,
    ): Promise<void> => {
        if (busyEntryId || entry.encrypted) {
            return;
        }

        try {
            const state = authState;
            if (!state.isSignedIn || !state.clerk) {
                errorMessage = t("phonebook.signInRequired");
                return;
            }

            busyEntryId = entry.id;
            void logUserFlowEvent("phonebook_import_attempt", {
                encrypted: Boolean(entry.encrypted),
            });
            const result = await importPhonebookCharacter(
                state.clerk,
                entry.id,
            );
            phonebookImportResult.set(result);
            closeModal();
            void logUserFlowEvent("phonebook_import_result", {
                outcome: "success",
                encrypted: Boolean(entry.encrypted),
            });
        } catch (error) {
            console.error("Failed to import phonebook entry", error);
            errorMessage =
                error instanceof Error
                    ? error.message
                    : t("phonebook.fetchFailed");
            void logUserFlowEvent("phonebook_import_result", {
                outcome: "failure",
                encrypted: Boolean(entry.encrypted),
                error_type: "unknown",
            });
        } finally {
            busyEntryId = null;
        }
    };

    // CRUD Operations
    const startCreate = () => {
        resetForm();
        isCreating = true;
    };

    const startEdit = (entry: PhonebookEntrySummary) => {
        resetForm();
        isEditing = true;
        editTargetId = entry.id;
        formName = entry.name;
        formDescription = entry.description || "";
        formEncrypted = entry.encrypted || false;
    };

    const handleFileSelect = (e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            formFile = input.files[0];
        }
    };

    const handleSave = async () => {
        if (!authState.clerk) return;
        if (isSubmitting) return;

        formError = "";
        isSubmitting = true;

        try {
            if (isCreating) {
                if (!formFile) {
                    formError = t("phonebook.fileRequired");
                    isSubmitting = false;
                    return;
                }
                const input: PhonebookEntryInput = {
                    name: formName,
                    description: formDescription,
                    file: formFile,
                    encrypted: formEncrypted,
                };
                await createPhonebookEntry(authState.clerk, input);
            } else if (isEditing && editTargetId) {
                const input: PhonebookEntryUpdateInput = {
                    name: formName,
                    description: formDescription,
                    encrypted: formEncrypted,
                };
                if (formFile) {
                    input.file = formFile;
                }
                await updatePhonebookEntry(
                    authState.clerk,
                    editTargetId,
                    input,
                );
            }

            // Refresh list
            const result = await listPhonebookEntries(authState.clerk);
            entries = result;
            resetForm();
        } catch (error) {
            console.error("Save failed", error);
            formError =
                error instanceof Error ? error.message : "Operation failed";
        } finally {
            isSubmitting = false;
        }
    };

    const handleDelete = async (id: string) => {
        if (!authState.clerk) return;
        if (!confirm(t("phonebook.confirmDelete"))) return;

        busyEntryId = id;
        try {
            await deletePhonebookEntry(authState.clerk, id);
            // Refresh list
            const result = await listPhonebookEntries(authState.clerk);
            entries = result;
        } catch (error) {
            console.error("Delete failed", error);
            errorMessage =
                error instanceof Error ? error.message : "Delete failed";
        } finally {
            busyEntryId = null;
        }
    };

    $: if (isOpen) {
        void initialize();
    } else {
        resetState();
    }
</script>

{#if isOpen}
    <div
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
        <div
            class="phonebook-modal w-full max-w-3xl mx-4 bg-gray-900 rounded-2xl shadow-xl border border-white/5 flex flex-col max-h-[85vh]"
        >
            <header
                class="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0"
            >
                <div>
                    <h2 class="text-lg font-semibold text-white">
                        {t("phonebook.title")}
                    </h2>
                    <p class="text-sm text-gray-400">
                        {t("phonebook.description")}
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    {#if !isCreating && !isEditing && authState.isSignedIn}
                        <button
                            class="p-2 rounded-full hover:bg-white/10 text-blue-400"
                            on:click={startCreate}
                            aria-label={t("phonebook.create")}
                        >
                            <Plus class="w-5 h-5" />
                        </button>
                    {/if}
                    <button
                        class="p-2 rounded-full hover:bg-white/10 text-gray-300"
                        on:click={handleRetry}
                        aria-label={t("phonebook.retry")}
                        disabled={isInitializing || isSubmitting}
                    >
                        <RefreshCcw
                            class={`w-5 h-5 ${isInitializing ? "animate-spin" : ""}`}
                        />
                    </button>
                    <button
                        class="p-2 rounded-full hover:bg-white/10 text-gray-300"
                        on:click={closeModal}
                        aria-label={t("phonebook.close")}
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto px-6 py-4">
                {#if isInitializing}
                    <div
                        class="flex items-center justify-center py-16 text-gray-400 gap-3"
                    >
                        <Loader2 class="w-5 h-5 animate-spin" />
                        <span>{t("phonebook.loading")}</span>
                    </div>
                {:else if errorMessage}
                    <div
                        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
                    >
                        <ShieldAlert class="w-10 h-10 text-amber-400" />
                        <p class="text-sm text-gray-300">{errorMessage}</p>
                        <button
                            class="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            on:click={handleRetry}
                            disabled={!isTracingEnabled}
                        >
                            {t("phonebook.retry")}
                        </button>
                    </div>
                {:else if isCreating || isEditing}
                    <!-- Create/Edit Form -->
                    <div class="space-y-4 max-w-lg mx-auto">
                        <h3 class="text-xl font-semibold text-white mb-6">
                            {isCreating
                                ? t("phonebook.create")
                                : t("phonebook.edit")}
                        </h3>

                        <div class="space-y-2">
                            <label
                                for="entry-name"
                                class="block text-sm font-medium text-gray-300"
                                >{t("phonebook.name")}</label
                            >
                            <input
                                type="text"
                                id="entry-name"
                                bind:value={formName}
                                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div class="space-y-2">
                            <label
                                for="entry-desc"
                                class="block text-sm font-medium text-gray-300"
                                >{t("phonebook.entryDescription")}</label
                            >
                            <textarea
                                id="entry-desc"
                                bind:value={formDescription}
                                rows="3"
                                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            ></textarea>
                        </div>

                        <div class="space-y-2">
                            <label
                                for="entry-file"
                                class="block text-sm font-medium text-gray-300"
                                >{t("phonebook.file")}</label
                            >
                            <div
                                class="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                            >
                                <input
                                    type="file"
                                    id="entry-file"
                                    accept=".json,.png"
                                    on:change={handleFileSelect}
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div class="text-center pointer-events-none">
                                    {#if formFile}
                                        <p class="text-sm text-blue-400">
                                            {formFile.name}
                                        </p>
                                    {:else}
                                        <Upload
                                            class="w-8 h-8 mx-auto text-gray-400 mb-2"
                                        />
                                        <p class="text-sm text-gray-400">
                                            Click to upload (.json, .png)
                                        </p>
                                    {/if}
                                </div>
                            </div>
                            <p class="text-xs text-gray-500">
                                {t("phonebook.unsupportedFile")}
                            </p>
                        </div>

                        <div class="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="entry-encrypted"
                                bind:checked={formEncrypted}
                                class="w-4 h-4 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                                for="entry-encrypted"
                                class="text-sm text-gray-300"
                                >{t("phonebook.encrypted")}</label
                            >
                        </div>

                        {#if formError}
                            <div
                                class="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm"
                            >
                                {formError}
                            </div>
                        {/if}

                        <div class="flex justify-end gap-3 pt-4">
                            <button
                                class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
                                on:click={resetForm}
                                disabled={isSubmitting}
                            >
                                {t("phonebook.cancel")}
                            </button>
                            <button
                                class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2 transition-colors"
                                on:click={handleSave}
                                disabled={isSubmitting}
                            >
                                {#if isSubmitting}
                                    <Loader2 class="w-4 h-4 animate-spin" />
                                    <span>{t("phonebook.uploading")}</span>
                                {:else}
                                    <Save class="w-4 h-4" />
                                    <span>{t("phonebook.save")}</span>
                                {/if}
                            </button>
                        </div>
                    </div>
                {:else if entries.length === 0}
                    <div
                        class="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-400"
                    >
                        <p>{t("phonebook.empty")}</p>
                    </div>
                {:else}
                    <ul class="space-y-3">
                        {#each entries as entry (entry.id)}
                            <li
                                class="bg-gray-800/60 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-800/80 transition-colors"
                            >
                                <div class="space-y-2 flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <h3
                                            class="text-base font-semibold text-white truncate"
                                        >
                                            {entry.name}
                                        </h3>
                                        {#if entry.encrypted}
                                            <span
                                                class="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex-shrink-0"
                                            >
                                                {t("phonebook.encrypted")}
                                            </span>
                                        {/if}
                                    </div>
                                    {#if entry.description}
                                        <p
                                            class="text-sm text-gray-300 line-clamp-2 break-words"
                                        >
                                            {entry.description}
                                        </p>
                                    {/if}
                                    <div
                                        class="flex flex-wrap items-center gap-3 text-xs text-gray-400"
                                    >
                                        {#if entry.author}
                                            <span
                                                >{t("phonebook.byAuthor", {
                                                    author: entry.author,
                                                })}</span
                                            >
                                        {/if}
                                        {#if typeof entry.downloadCount === "number"}
                                            <span
                                                >{t("phonebook.downloads", {
                                                    count: entry.downloadCount.toString(),
                                                })}</span
                                            >
                                        {/if}
                                        {#if typeof entry.uploadedAt === "number"}
                                            <span
                                                >{t("phonebook.uploaded", {
                                                    date: new Date(
                                                        entry.uploadedAt,
                                                    ).toLocaleString(),
                                                })}</span
                                            >
                                        {/if}
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-2 self-stretch md:self-center flex-shrink-0"
                                >
                                    <!-- Edit/Delete for Author or Admin -->
                                    {#if authState.user && (authState.user.id === entry.author || authState.user.publicMetadata?.role === "admin")}
                                        <button
                                            class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
                                            on:click={() => startEdit(entry)}
                                            aria-label={t("phonebook.edit")}
                                        >
                                            <Pencil class="w-4 h-4" />
                                        </button>
                                        <button
                                            class="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-sm transition-colors"
                                            on:click={() =>
                                                handleDelete(entry.id)}
                                            disabled={busyEntryId === entry.id}
                                            aria-label={t("phonebook.delete")}
                                        >
                                            {#if busyEntryId === entry.id}
                                                <Loader2
                                                    class="w-4 h-4 animate-spin"
                                                />
                                            {:else}
                                                <Trash2 class="w-4 h-4" />
                                            {/if}
                                        </button>
                                    {/if}

                                    <button
                                        class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                        on:click={() => handleImport(entry)}
                                        disabled={entry.encrypted ||
                                            Boolean(busyEntryId)}
                                    >
                                        {#if busyEntryId === entry.id}
                                            <Loader2
                                                class="w-4 h-4 animate-spin"
                                            />
                                            <span
                                                >{t(
                                                    "phonebook.importing",
                                                )}</span
                                            >
                                        {:else}
                                            <Download class="w-4 h-4" />
                                            <span>{t("phonebook.import")}</span>
                                        {/if}
                                    </button>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .phonebook-modal {
        backdrop-filter: blur(16px);
    }
</style>
