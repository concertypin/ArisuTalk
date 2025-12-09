import { get, writable, type Readable } from "svelte/store";
import { Clerk } from "@clerk/clerk-js";
import {
	phonebookAccessState,
	isPhonebookModalVisible,
	type PhonebookAccessState,
} from "./ui";
import { settings } from "./settings";

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
let experimentalOptIn = false;
let hasOptInInitialized = false;
const AUTH_INIT_TIMEOUT_MS = 5000;

const computeExperimentalOptIn = (): boolean => {
	const current = get(settings) as { experimentalTracingEnabled?: boolean };
	return Boolean(current?.experimentalTracingEnabled);
};

const teardownClerkListener = (): void => {
	removeListener?.();
	removeListener = null;
};

const markAuthDisabled = (
	phonebookState: PhonebookAccessState = "unknown",
): void => {
	authState.set({
		status: "disabled",
		clerk: null,
		user: null,
		isSignedIn: false,
		error: null,
	});
	phonebookAccessState.set(phonebookState);
};

const performSignOutIfNeeded = async (): Promise<void> => {
	const snapshot = get(authState);
	if (snapshot.status === "ready" && snapshot.clerk) {
		try {
			await snapshot.clerk.signOut();
		} catch (error) {
			console.error("Failed to sign out during experimental opt-out", error);
		}
	}
};

const cleanupAuthForOptOut = async (): Promise<void> => {
	const pending = initializePromise;
	if (pending) {
		try {
			// Wait for pending initialization, but timeout after 5 seconds
			await Promise.race([
				pending,
				new Promise((_, reject) =>
					setTimeout(
						() =>
							reject(
								new Error("Auth initialization timeout during opt-out cleanup"),
							),
						AUTH_INIT_TIMEOUT_MS,
					),
				),
			]);
		} catch (error) {
			console.error("Auth initialization failed before opt-out cleanup", error);
		}
	}

	teardownClerkListener();
	await performSignOutIfNeeded();

	hasInitialized = false;
	initializePromise = null;
	lastKnownUserId = null;

	markAuthDisabled("disabled");
	isPhonebookModalVisible.set(false);
};

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
export async function initializeAuth(): Promise<void> {
	if (!experimentalOptIn) {
		await cleanupAuthForOptOut();
		return;
	}

	if (hasInitialized) {
		return;
	}

	if (initializePromise) {
		await initializePromise;
		return;
	}

	if (typeof window === "undefined") {
		markAuthDisabled("disabled");
		hasInitialized = true;
		return;
	}

	const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

	if (!publishableKey) {
		markAuthDisabled("disabled");
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
	phonebookAccessState.set("unknown");

	initializePromise = (async () => {
		const clerkClient = new Clerk(publishableKey);
		await clerkClient.load();
		syncFromClerk(clerkClient);

		teardownClerkListener();
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
				rawError instanceof Error ? rawError : new Error(String(rawError));
			authState.set({
				status: "error",
				clerk: null,
				user: null,
				isSignedIn: false,
				error,
			});
			phonebookAccessState.set("disabled");
			hasInitialized = false;
			throw error;
		})
		.finally(() => {
			initializePromise = null;
		});

	await initializePromise;
}

settings.subscribe((value) => {
	const next = Boolean(value?.experimentalTracingEnabled);
	const previous = experimentalOptIn;

	if (!hasOptInInitialized) {
		hasOptInInitialized = true;
		experimentalOptIn = next;

		if (next) {
			void initializeAuth();
		} else {
			void cleanupAuthForOptOut();
		}
		return;
	}

	if (next === previous) {
		return;
	}

	experimentalOptIn = next;

	if (!next) {
		void cleanupAuthForOptOut();
		return;
	}

	hasInitialized = false;
	void initializeAuth();
});

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
