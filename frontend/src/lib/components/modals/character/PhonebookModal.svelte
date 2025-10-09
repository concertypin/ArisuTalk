<script lang="ts">
    import { t } from "../../../../i18n.js";
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
    import type { PhonebookEntrySummary } from "../../../services/phonebookService";
    import { logUserFlowEvent } from "../../../analytics/userFlow";
    import {
        X,
        Download,
        RefreshCcw,
        ShieldAlert,
        Loader2,
    } from "lucide-svelte";

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
    let serviceModule:
        | typeof import("../../../services/phonebookService")
        | null = null;

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
    };

    const ensureService = async () => {
        if (!serviceModule) {
            serviceModule = await import(
                "../../../services/phonebookService.ts"
            );
        }
        return serviceModule;
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

            const service = await ensureService();
            let accessState = currentPhonebookAccess;
            if (accessState === "unknown") {
                const canAccess = await service.verifyPhonebookAccess(
                    state.clerk
                );
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

            const result = await service.listPhonebookEntries(state.clerk);
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
        entry: PhonebookEntrySummary
    ): Promise<void> => {
        if (busyEntryId || entry.encrypted) {
            return;
        }

        try {
            const state = authState;
            if (!state.isSignedIn || !state.clerk) {
                errorMessage = t("phonebook.signInRequired");
                void logUserFlowEvent("phonebook_import_result", {
                    outcome: "failure",
                    encrypted: Boolean(entry.encrypted),
                    error_type: "not_signed_in",
                });
                return;
            }

            const service = await ensureService();
            busyEntryId = entry.id;
            void logUserFlowEvent("phonebook_import_attempt", {
                encrypted: Boolean(entry.encrypted),
            });
            const result = await service.importPhonebookCharacter(
                state.clerk,
                entry.id
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
            class="phonebook-modal w-full max-w-3xl mx-4 bg-gray-900 rounded-2xl shadow-xl border border-white/5"
        >
            <header
                class="flex items-center justify-between px-6 py-4 border-b border-white/5"
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
                    <button
                        class="p-2 rounded-full hover:bg-white/10 text-gray-300"
                        on:click={handleRetry}
                        aria-label={t("phonebook.retry")}
                        disabled={isInitializing}
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
            <section class="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
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
                                class="bg-gray-800/60 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div class="space-y-2 flex-1">
                                    <div class="flex items-center gap-2">
                                        <h3
                                            class="text-base font-semibold text-white"
                                        >
                                            {entry.name}
                                        </h3>
                                        {#if entry.encrypted}
                                            <span
                                                class="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/40"
                                            >
                                                {t("phonebook.encrypted")}
                                            </span>
                                        {/if}
                                    </div>
                                    {#if entry.description}
                                        <p class="text-sm text-gray-300">
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
                                                        entry.uploadedAt
                                                    ).toLocaleString(),
                                                })}</span
                                            >
                                        {/if}
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-2 self-stretch md:self-center"
                                >
                                    <button
                                        class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                                    "phonebook.importing"
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
            </section>
        </div>
    </div>
{/if}

<style>
    .phonebook-modal {
        backdrop-filter: blur(16px);
    }
</style>
