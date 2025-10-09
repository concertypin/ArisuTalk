import { derived, writable, get } from "svelte/store";
import {
    fetchExperimentAssignments,
    getExperimentVariant,
    initFirebaseAnalytics,
    logFirebaseEvent,
    setFirebaseUserProperties,
    type AnalyticsEventPayload,
    type ExperimentAssignments,
    type FirebaseAnalyticsContext,
} from "../services/firebaseAnalytics";
import { addLog } from "../services/logService";
import { settings } from "./settings";

export type FirebaseAnalyticsStatus =
    | "idle"
    | "initializing"
    | "ready"
    | "error";

export interface FirebaseAnalyticsState {
    status: FirebaseAnalyticsStatus;
    context: FirebaseAnalyticsContext | null;
    assignments: ExperimentAssignments;
    error: string | null;
}

const initialState: FirebaseAnalyticsState = {
    status: "idle",
    context: null,
    assignments: {},
    error: null,
};

const state = writable<FirebaseAnalyticsState>(initialState);
let analyticsOptIn = false;

// Subscribe to settings and initialize analyticsOptIn after the first value is emitted
settings.subscribe((value) => {
    const isTracingEnabled = Boolean(value?.experimentalTracingEnabled);

    // Initialize analyticsOptIn on first run
    if (analyticsOptIn === false && isTracingEnabled === true) {
        analyticsOptIn = isTracingEnabled;
        void loadFirebaseAnalytics();
        return;
    }

    if (isTracingEnabled === analyticsOptIn) {
        return;
    }

    analyticsOptIn = isTracingEnabled;

    if (!isTracingEnabled) {
        state.set({ ...initialState });
        return;
    }

    void loadFirebaseAnalytics();
});

/**
 * Read-only store exposing the Firebase analytics state for the app.
 */
export const firebaseAnalyticsState = {
    subscribe: state.subscribe,
};

/**
 * Derived store that yields true when analytics are ready.
 */
export const isFirebaseAnalyticsReady = derived(
    state,
    (value) => value.status === "ready" && value.context !== null
);

/**
 * Derived store providing experiment assignments when available.
 */
export const experimentAssignments = derived(
    state,
    (value) => value.assignments
);

/**
 * Initialize Firebase analytics and populate experiment assignments.
 *
 * @returns {Promise<void>} Resolves when initialization is completed.
 */
export async function loadFirebaseAnalytics(): Promise<void> {
    if (!analyticsOptIn) {
        state.set({ ...initialState });
        return;
    }

    state.update((current) => ({
        ...current,
        status: "initializing",
        error: null,
    }));

    try {
        const context = await initFirebaseAnalytics();
        const assignments = await fetchExperimentAssignments();

        if (Object.keys(assignments).length > 0) {
            await setFirebaseUserProperties(assignments);
        }

        state.set({
            status: "ready",
            context,
            assignments,
            error: null,
        });

        addLog({
            type: "simple",
            level: "Info",
            message: `[firebase] Analytics initialized with ${Object.keys(assignments).length} experiments`,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Failed to initialize Firebase analytics.";

        state.set({
            status: "error",
            context: null,
            assignments: {},
            error: message,
        });

        addLog({
            type: "simple",
            level: "Error",
            message: `[firebase] Analytics initialization failed: ${message}`,
        });
    }
}

/**
 * Fetch the latest experiment assignments from Remote Config and update the store.
 *
 * @returns {Promise<ExperimentAssignments>} Latest assignments map.
 */
export async function refreshExperimentAssignments(): Promise<ExperimentAssignments> {
    if (!analyticsOptIn) {
        state.set({ ...initialState });
        return {};
    }

    const assignments = await fetchExperimentAssignments();
    state.update((current) => ({ ...current, assignments }));
    return assignments;
}

/**
 * Retrieve a specific experiment assignment in a type-safe manner.
 *
 * @param {string} key Remote Config key for the experiment.
 * @returns {string | null} Variant string when available, null otherwise.
 */
export function getAssignment(key: string): string | null {
    const current = get(state);
    return current.assignments[key] ?? null;
}

/**
 * Log an event enriched with experiment metadata.
 *
 * @param {string} eventName Firebase analytics event name.
 * @param {AnalyticsEventPayload} payload Additional event payload.
 * @returns {Promise<void>} Resolves when logging is complete.
 */
export async function trackEvent(
    eventName: string,
    payload: AnalyticsEventPayload = {}
): Promise<void> {
    if (!analyticsOptIn) {
        return;
    }

    const assignments = get(state).assignments;
    const experimentPayload: AnalyticsEventPayload = Object.fromEntries(
        Object.entries(assignments).map(([key, value]) => [`exp_${key}`, value])
    );

    await logFirebaseEvent(eventName, { ...experimentPayload, ...payload });
}

/**
 * Retrieve an experiment assignment directly from Remote Config for real-time overrides.
 *
 * @param {string} key Remote Config key.
 * @returns {Promise<string | null>} Latest variant value.
 */
export async function fetchAssignment(key: string): Promise<string | null> {
    if (!analyticsOptIn) {
        return null;
    }

    const variant = await getExperimentVariant(key);

    if (variant !== null) {
        state.update((current) => ({
            ...current,
            assignments: { ...current.assignments, [key]: variant },
        }));
    }

    return variant;
}
