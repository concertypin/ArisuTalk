/**
 * Firebase Analytics service helpers for experiment-aware tracking.
 */
import {
    initializeApp,
    getApps,
    getApp,
    type FirebaseApp,
    type FirebaseOptions,
} from "firebase/app";
import {
    getAnalytics,
    isSupported,
    type Analytics,
    logEvent,
    setUserProperties,
    type CustomParams,
} from "firebase/analytics";
import {
    getRemoteConfig,
    type RemoteConfig,
    type RemoteConfigSettings,
    fetchAndActivate,
    getAll,
    getValue,
    type Value,
} from "firebase/remote-config";

const isBrowser = typeof window !== "undefined";

let firebaseApp: FirebaseApp | null = null;
let analyticsInstance: Promise<Analytics | null> | null = null;
let remoteConfigInstance: Promise<RemoteConfig | null> | null = null;

type AnalyticsEventValue = string | number | boolean | null | undefined;

export type AnalyticsEventPayload = Record<string, AnalyticsEventValue>;

export type ExperimentAssignments = Record<string, string>;

export interface FirebaseAnalyticsContext {
    app: FirebaseApp;
    analytics: Analytics | null;
    remoteConfig: RemoteConfig | null;
}

/**
 * Parse Firebase configuration from the Vite environment payload.
 *
 * @returns {FirebaseOptions} Fully-typed Firebase configuration.
 */
function readFirebaseConfig(): FirebaseOptions {
    const rawConfig = import.meta.env.VITE_FIREBASE_AUTH;

    if (!rawConfig) {
        throw new Error("Missing VITE_FIREBASE_AUTH environment variable.");
    }

    try {
        return JSON.parse(rawConfig) as FirebaseOptions;
    } catch (error) {
        throw new Error("Malformed VITE_FIREBASE_AUTH environment variable.");
    }
}

/**
 * Initialize or reuse an existing Firebase app instance.
 *
 * @returns {FirebaseApp} Singleton Firebase application instance.
 */
function ensureFirebaseApp(): FirebaseApp {
    if (firebaseApp) {
        return firebaseApp;
    }

    const config = readFirebaseConfig();
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);

    return firebaseApp;
}

/**
 * Initialize Firebase Analytics if the environment supports it.
 *
 * @returns {Promise<Analytics | null>} Analytics instance or null when unsupported.
 */
async function ensureAnalytics(): Promise<Analytics | null> {
    if (!isBrowser) {
        return null;
    }

    if (!analyticsInstance) {
        analyticsInstance = (async () => {
            const supported = await isSupported();

            if (!supported) {
                return null;
            }

            const app = ensureFirebaseApp();
            return getAnalytics(app);
        })();
    }

    return analyticsInstance;
}

/**
 * Initialize Remote Config, fetching experiments for A/B testing audiences.
 *
 * @returns {Promise<RemoteConfig | null>} Remote Config instance when available.
 */
async function ensureRemoteConfig(): Promise<RemoteConfig | null> {
    if (!isBrowser) {
        return null;
    }

    if (!remoteConfigInstance) {
        remoteConfigInstance = (async () => {
            const app = ensureFirebaseApp();
            const remoteConfig = getRemoteConfig(app);
            const settings: RemoteConfigSettings = {
                minimumFetchIntervalMillis: 60_000,
                fetchTimeoutMillis: 10_000,
            };

            remoteConfig.settings = settings;

            try {
                await fetchAndActivate(remoteConfig);
            } catch (error) {
                console.error("[firebase] Remote Config fetch failed", error);
            }

            return remoteConfig;
        })();
    }

    return remoteConfigInstance;
}

/**
 * Initialize Firebase Analytics and Remote Config.
 *
 * @returns {Promise<FirebaseAnalyticsContext>} Initialized Firebase context.
 */
export async function initFirebaseAnalytics(): Promise<FirebaseAnalyticsContext> {
    const app = ensureFirebaseApp();
    const [analytics, remoteConfig] = await Promise.all([
        ensureAnalytics(),
        ensureRemoteConfig(),
    ]);

    return { app, analytics, remoteConfig };
}

/**
 * Retrieve experiment assignments from Remote Config values.
 *
 * @returns {Promise<ExperimentAssignments>} Key-value pairs for experiment variants.
 */
export async function fetchExperimentAssignments(): Promise<ExperimentAssignments> {
    const remoteConfig = await ensureRemoteConfig();

    if (!remoteConfig) {
        return {};
    }

    const values = getAll(remoteConfig);
    const assignments: ExperimentAssignments = {};
    const entries = Object.entries(values) as Array<[string, Value]>;

    for (const [key, value] of entries) {
        assignments[key] = value.asString();
    }

    return assignments;
}

/**
 * Retrieve a single experiment variant value.
 *
 * @param {string} key Remote Config key for the experiment.
 * @returns {Promise<string | null>} Variant string or null when absent.
 */
export async function getExperimentVariant(
    key: string,
): Promise<string | null> {
    const remoteConfig = await ensureRemoteConfig();

    if (!remoteConfig) {
        return null;
    }

    const value = getValue(remoteConfig, key);
    const variant = value.asString();

    return variant.length > 0 ? variant : null;
}

/**
 * Log an analytics event with structured parameters.
 *
 * @param {string} eventName Firebase Analytics event name.
 * @param {AnalyticsEventPayload} [parameters] Optional parameters describing the event context.
 * @returns {Promise<void>} Resolves when the event is sent or skipped.
 */
export async function logFirebaseEvent(
    eventName: string,
    parameters?: AnalyticsEventPayload,
): Promise<void> {
    const analytics = await ensureAnalytics();

    if (!analytics) {
        return;
    }

    logEvent(analytics, eventName, parameters);
}

/**
 * Assign custom user properties for segmentation.
 *
 * @param {CustomParams} properties Key-value map for user properties.
 * @returns {Promise<void>} Resolves when properties are stored or skipped when unsupported.
 */
export async function setFirebaseUserProperties(
    properties: CustomParams,
): Promise<void> {
    const analytics = await ensureAnalytics();

    if (!analytics) {
        return;
    }

    setUserProperties(analytics, properties);
}
