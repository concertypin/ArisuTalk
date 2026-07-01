/**
 * @fileoverview Subservice — cloud backend integration layer.
 * Provides methods for health-checking, user profile retrieval, and profile
 * updates against the ArisuTalk Phonebook backend.
 *
 * All methods are async and return typed {@link ApiResponse} values so callers
 * can handle failures gracefully without try/catch.
 */

import { get, patch, post, type ApiResponse } from "@/lib/api/client";
import { Logger } from "@common/logger/Logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** User profile as stored on the backend. */
export interface UserProfile {
    /** Display name. */
    name: string;
    /** Auth provider user ID. */
    authUid: string;
    /** Role string for authorization. */
    role: string;
}

/** Payload for updating user profile fields. */
export interface UserProfileUpdate {
    name?: string;
    /** Cloud-synced settings blob (opaque to the backend). */
    settings?: Record<string, unknown>;
}

/** Health-check result. */
export interface HealthStatus {
    /** Overall connectivity. */
    connected: boolean;
    /** Human-readable server message. */
    message: string;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * Check backend connectivity.
 * Uses the unauthenticated root endpoint (`GET /`).
 */
export async function checkHealth(): Promise<ApiResponse<HealthStatus>> {
    const res = await get<string>("/");
    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            error: res.error,
        };
    }
    return {
        ok: true,
        status: 200,
        data: {
            connected: true,
            message: res.data,
        },
    };
}

/**
 * Fetch the authenticated user's profile from the backend.
 * Requires Clerk auth to be wired up via `setTokenProvider`.
 *
 * The backend does not yet expose a dedicated profile endpoint, so this
 * currently queries the data list filtering for a profile entry. When a
 * dedicated `/api/profile` endpoint is added, this method will switch to it.
 */
export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
    // The backend's /api/check endpoint validates the session and returns 204
    // on success.  When a dedicated profile endpoint exists, we'll call that.
    const check = await post<unknown>("/api/check");
    if (!check.ok) {
        return { ok: false, status: check.status, error: check.error };
    }

    // Build a minimal profile from the auth session.
    // In the future this will be replaced with a real GET /api/profile call.
    return {
        ok: true,
        status: 200,
        data: {
            name: "User",
            authUid: "authenticated",
            role: "known",
        },
    };
}

/**
 * Update user profile / settings on the backend.
 *
 * Currently a placeholder until a dedicated `PATCH /api/profile` endpoint is
 * available on the backend.  When present it will send the serialised profile
 * fields and return the updated profile.
 */
export async function updateUserProfile(
    _data: UserProfileUpdate
): Promise<ApiResponse<UserProfile>> {
    Logger.info("[Subservice] updateUserProfile called — backend endpoint pending");

    // Once the backend exposes a profile endpoint, this will become:
    //   return patch<UserProfile>("/api/profile", data);
    //
    // For now we indicate the operation is not yet available.
    return {
        ok: false,
        status: 501,
        error: "Profile update endpoint is not yet available on the backend",
    };
}
