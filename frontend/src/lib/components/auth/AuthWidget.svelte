<script lang="ts">
import { t } from "$root/i18n";
import { onMount } from "svelte";

import {
	type AuthState,
	auth,
	initializeAuth,
	openSignIn,
	openUserProfile,
	signOut,
} from "../../stores/auth";
import ClerkUserButton from "./ClerkUserButton.svelte";

const defaultState: AuthState = {
	status: "idle",
	clerk: null,
	user: null,
	isSignedIn: false,
	error: null,
};

let state: AuthState = defaultState;

/**
 * Resolve a user-friendly display name from the Clerk user resource.
 * @returns Preferred display name or an empty string when unavailable.
 */
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

/**
 * Trigger the Clerk sign-in flow.
 */
const handleSignInClick = async (): Promise<void> => {
	await openSignIn();
};

/**
 * Attempt to re-initialize Clerk after a failure.
 */
const handleRetry = async (): Promise<void> => {
	await initializeAuth();
};

/**
 * Open the Clerk-hosted user profile dialog when available.
 */
const handleProfileOpen = async (): Promise<void> => {
	await openUserProfile();
};

/**
 * Sign the active user out of Clerk.
 */
const handleSignOut = async (): Promise<void> => {
	await signOut();
};

$: state = $auth ?? defaultState;

onMount(async () => {
	try {
		await initializeAuth();
	} catch (error) {
		console.error("Clerk initialization failed", error);
	}
});

$: status = state.status;
$: isDisabled = status === "disabled";
$: isReady = status === "ready";
$: isLoading = status === "loading";
$: isError = status === "error";
$: isSignedIn = state.isSignedIn;
$: displayName = getUserDisplayName();
</script>

{#if isDisabled}
    <!-- Invisible -->
{:else if isReady && isSignedIn}
    <div class="auth-widget__signed-in" aria-live="polite">
        {#if displayName}
            <button class="auth-widget__name" on:click={handleProfileOpen}>
                {t("auth.signedInAs", { name: displayName })}
            </button>
        {/if}
        <ClerkUserButton />
        <button class="auth-widget__signout" on:click={handleSignOut}>
            {t("auth.signOut")}
        </button>
    </div>
{:else}
    <div class="auth-widget__controls">
        <button
            class="auth-widget__signin"
            disabled={isLoading || isError}
            on:click={handleSignInClick}
        >
            {t("auth.signIn")}
        </button>
        {#if isError}
            <button class="auth-widget__retry" on:click={handleRetry}
                >{t("auth.retry")}</button
            >
        {/if}
    </div>
{/if}

<style>
    .auth-widget__controls,
    .auth-widget__signed-in {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .auth-widget__signin,
    .auth-widget__retry,
    .auth-widget__signout,
    .auth-widget__name {
        background-color: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 9999px;
        color: rgb(191, 219, 254);
        cursor: pointer;
        font-size: 0.75rem;
        padding: 0.35rem 0.75rem;
        transition:
            background-color 0.2s ease,
            color 0.2s ease;
    }

    .auth-widget__signin:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .auth-widget__signin:hover:not(:disabled),
    .auth-widget__retry:hover,
    .auth-widget__signout:hover,
    .auth-widget__name:hover {
        background-color: rgba(59, 130, 246, 0.35);
        color: white;
    }
</style>
