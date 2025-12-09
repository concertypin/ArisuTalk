/**
 * @fileoverview API client for backend communication.
 * Wraps fetch with common configuration and error handling.
 */

/**
 * Standard API response wrapper.
 * Unifies successful and error responses into a single type.
 */
export type ApiResponse<T> =
    | {
          /** The data returned by the API (null if error). */
          data: T | null;
          /** Error message if the request failed. */
          error: string;
          /** HTTP status code. */
          status: number;
      }
    | {
          /** The data returned by the API. */
          data: T;
          /** HTTP status code. */
          status: number;
      };

/** Base API configuration */

/**
 * Make an API request with standard error handling.
 * Fetch API should not be used directly, since it can't handle CORS.
 */
export async function apiRequest<T>(
    _endpoint: string,
    _options?: RequestInit
): Promise<ApiResponse<T>> {
    throw new Error("Not implemented");
}

/** GET request shorthand */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, { method: "GET" });
}

/** POST request shorthand */
export async function post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
    });
}

/** PATCH request shorthand */
export async function patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
    });
}

/** DELETE request shorthand */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, { method: "DELETE" });
}
