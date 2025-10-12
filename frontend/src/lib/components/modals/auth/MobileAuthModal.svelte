<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { t } from "../../../../i18n.js";
    import {
        auth,
        initializeAuth,
        openSignIn,
        openUserProfile,
        signOut,
        type AuthState,
    } from "../../../stores/auth";
    import { isMobileAuthModalVisible } from "../../../stores/ui";
    import {
        X,
        LogIn,
        LogOut,
        UserCircle2,
        Loader2,
        AlertCircle,
    } from "lucide-svelte";

    export let isOpen = false;

    const defaultState: AuthState = {
        status: "idle",
        clerk: null,
        user: null,
        isSignedIn: false,
        error: null,
    };

    let state: AuthState = defaultState;

    const closeModal = (): void => {
        isMobileAuthModalVisible.set(false);
    };

    const getUserDisplayName = (): string => {
        const user = state.user;
        if (!user || typeof user !== "object") {
            return "";
        }

        const withFallback = [
            (user as { fullName?: string }).fullName,
            (user as { firstName?: string }).firstName,
            (user as { username?: string }).username,
            (user as { primaryEmailAddress?: { emailAddress?: string } })
                .primaryEmailAddress?.emailAddress,
        ].find((value) => Boolean(value));

        return withFallback ?? "";
    };

    const handleSignIn = async (): Promise<void> => {
        await openSignIn();
    };

    const handleOpenProfile = async (): Promise<void> => {
        await openUserProfile();
    };

    const handleSignOut = async (): Promise<void> => {
        await signOut();
    };

    const handleRetry = async (): Promise<void> => {
        await initializeAuth();
    };

    const handleKeydown = (event: KeyboardEvent): void => {
        if (!isOpen) {
            return;
        }
        if (event.key === "Escape") {
            closeModal();
        }
    };

    onMount(() => {
        const unsubscribe = auth.subscribe((value) => {
            state = value ?? defaultState;
        });

        window.addEventListener("keydown", handleKeydown);

        (async () => {
            try {
                await initializeAuth();
            } catch (error) {
                console.error(
                    "Failed to initialize Clerk for mobile auth modal",
                    error
                );
            }
        })();

        return () => {
            unsubscribe();
            window.removeEventListener("keydown", handleKeydown);
        };
    });

    $: status = state.status;
    $: isDisabled = status === "disabled";
    $: isReady = status === "ready";
    $: isLoading = status === "loading";
    $: isError = status === "error";
    $: isSignedIn = state.isSignedIn;
    $: displayName = getUserDisplayName();
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur"
        transition:fade={{ duration: 150 }}
        on:pointerdown|self={closeModal}
    >
        <div
            class="w-full sm:max-w-md sm:rounded-2xl sm:border sm:border-white/10 bg-gray-900 text-white px-6 pt-6 pb-8 flex flex-col gap-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-auth-modal-title"
            aria-describedby="mobile-auth-modal-description"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded-full bg-blue-500/10 text-blue-300">
                        <UserCircle2 class="w-6 h-6" />
                    </div>
                    <div class="flex flex-col">
                        <span
                            id="mobile-auth-modal-title"
                            class="text-base font-semibold"
                            >{t("auth.account")}</span
                        >
                        <span
                            id="mobile-auth-modal-description"
                            class="text-sm text-gray-400"
                        >
                            {#if isSignedIn && displayName}
                                {t("auth.signedInAs", { name: displayName })}
                            {:else}
                                {t("auth.manageAccount")}
                            {/if}
                        </span>
                    </div>
                </div>
                <button
                    class="p-2 rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    on:click={closeModal}
                    aria-label={t("common.close")}
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            {#if isDisabled}
                <div class="flex flex-col items-center text-center gap-3 py-8">
                    <AlertCircle class="w-10 h-10 text-amber-400" />
                    <p class="text-sm text-gray-300">
                        {t("auth.authUnavailable")}
                    </p>
                    <p class="text-xs text-blue-200/80 max-w-xs">
                        {t("auth.experimentalOptInRequired")}
                    </p>
                </div>
            {:else if isReady && isSignedIn}
                <div class="space-y-4">
                    <button
                        class="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
                        on:click={handleOpenProfile}
                    >
                        <div class="flex flex-col text-left">
                            <span class="text-sm text-blue-100">
                                {displayName
                                    ? t("auth.signedInAs", {
                                          name: displayName,
                                      })
                                    : t("auth.manageAccount")}
                            </span>
                            <span class="text-xs text-blue-200/70"
                                >{t("auth.openProfile")}</span
                            >
                        </div>
                        <UserCircle2 class="w-5 h-5" />
                    </button>
                    <button
                        class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                        on:click={handleSignOut}
                    >
                        <LogOut class="w-5 h-5" />
                        <span>{t("auth.signOut")}</span>
                    </button>
                </div>
            {:else}
                <div class="space-y-4">
                    <button
                        class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        on:click={handleSignIn}
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <Loader2 class="w-5 h-5 animate-spin" />
                            <span>{t("auth.loading")}</span>
                        {:else}
                            <LogIn class="w-5 h-5" />
                            <span>{t("auth.signIn")}</span>
                        {/if}
                    </button>
                    <p class="text-xs text-center text-gray-400">
                        {t("phonebook.signInRequired")}
                    </p>
                    {#if isError}
                        <div
                            class="flex flex-col items-center gap-2 text-center text-sm text-amber-300"
                        >
                            <AlertCircle class="w-6 h-6" />
                            <span
                                >{state.error?.message ?? t("auth.retry")}</span
                            >
                            <button
                                class="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                                on:click={handleRetry}
                            >
                                {t("auth.retry")}
                            </button>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    @media (min-width: 640px) {
        div[role="dialog"] {
            border-radius: 1rem;
        }
    }
</style>
