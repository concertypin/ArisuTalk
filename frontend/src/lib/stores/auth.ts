import { get, writable, type Readable } from "svelte/store";
import { Clerk } from "@clerk/clerk-js";
import { phonebookAccessState } from "./ui";

export type ClerkInstance = InstanceType<typeof Clerk>;
type ClerkUser = ClerkInstance["user"];

export type AuthStatus = "idle" | "loading" | "ready" | "disabled" | "error";

export interface AuthState {
    status: AuthStatus;
    clerk: ClerkInstance | null;
    user: ClerkUser | null;
    isSignedIn: boolean;
    error: Error | null;
}

const initialState: AuthState = {
    status: "idle",
    clerk: null,
    user: null,
    isSignedIn: false,
    error: null,
};

const authState = writable<AuthState>(initialState);

let lastKnownUserId: string | null = null;

let initializePromise: Promise<void> | null = null;
let hasInitialized = false;
let removeListener: (() => void) | null = null;

const updatePhonebookAccessState = (userId: string | null): void => {
    if (lastKnownUserId === userId) {
        return;
    }
    phonebookAccessState.set("unknown");
    lastKnownUserId = userId;
};

export const auth: Readable<AuthState> = {
    subscribe: authState.subscribe,
};

/**
 * Synchronize the Svelte auth store with the current Clerk client.
 * @param clerk - Loaded Clerk instance that provides authentication state.
 */
const syncFromClerk = (clerk: ClerkInstance): void => {
    authState.set({
        status: "ready",
        clerk,
        user: clerk.user ?? null,
        isSignedIn: Boolean(clerk.user),
        error: null,
    });
    updatePhonebookAccessState(clerk.user?.id ?? null);
};

/**
 * Initialize the Clerk authentication client and keep the Svelte store in sync.
 */
export const initializeAuth = async (): Promise<void> => {
    if (hasInitialized) {
        return;
    }

    if (initializePromise) {
        await initializePromise;
        return;
    }

    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    if (typeof window === "undefined") {
        authState.set({
            status: "disabled",
            clerk: null,
            user: null,
            isSignedIn: false,
            error: null,
        });
        updatePhonebookAccessState(null);
        hasInitialized = true;
        return;
    }

    if (!publishableKey) {
        authState.set({
            status: "disabled",
            clerk: null,
            user: null,
            isSignedIn: false,
            error: null,
        });
        updatePhonebookAccessState(null);
        hasInitialized = true;
        return;
    }

    authState.set({
        status: "loading",
        clerk: null,
        user: null,
        isSignedIn: false,
        error: null,
    });
    updatePhonebookAccessState(null);

    initializePromise = (async () => {
        const clerkClient = new Clerk(publishableKey);
        await clerkClient.load();
        syncFromClerk(clerkClient);

        removeListener?.();
        removeListener = clerkClient.addListener(({ user }) => {
            authState.update((current) => ({
                ...current,
                status: "ready",
                clerk: clerkClient,
                user: user ?? clerkClient.user ?? null,
                isSignedIn: Boolean(user ?? clerkClient.user),
                error: null,
            }));
            const nextUser = user ?? clerkClient.user ?? null;
            updatePhonebookAccessState(nextUser?.id ?? null);
        });

        hasInitialized = true;
    })()
        .catch((rawError) => {
            const error =
                rawError instanceof Error
                    ? rawError
                    : new Error(String(rawError));
            authState.set({
                status: "error",
                clerk: null,
                user: null,
                isSignedIn: false,
                error,
            });
            updatePhonebookAccessState(null);
            hasInitialized = false;
            throw error;
        })
        .finally(() => {
            initializePromise = null;
        });

    await initializePromise;
};

/**
 * Return the latest authentication state snapshot.
 */
export const getAuthState = (): AuthState => get(authState);

/**
 * Open the Clerk sign-in modal when authentication is available.
 */
export const openSignIn = async (): Promise<void> => {
    await initializeAuth();
    const state = getAuthState();
    if (state.status !== "ready" || !state.clerk) {
        return;
    }
    state.clerk.openSignIn({});
};

/**
 * Open the Clerk user profile modal if the user is signed in.
 */
export const openUserProfile = async (): Promise<void> => {
    await initializeAuth();
    const state = getAuthState();
    if (state.status !== "ready" || !state.clerk) {
        return;
    }
    state.clerk.openUserProfile({});
};

/**
 * Sign out the current Clerk session if possible.
 */
export const signOut = async (): Promise<void> => {
    await initializeAuth();
    const state = getAuthState();
    if (state.status !== "ready" || !state.clerk) {
        return;
    }
    await state.clerk.signOut();
    updatePhonebookAccessState(null);
};
