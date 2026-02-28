// frontend/src/api/client.js

export const API_BASE_URL = "http://localhost:4000";

/**
 * Basic JSON request helper:
 * - includes cookies (accessToken/refreshToken)
 * - parses JSON safely
 * - throws readable errors
 */
export async function apiRequest(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;

    const resp = await fetch(url, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    let data = null;
    try {
        data = await resp.json();
    } catch {
        // some endpoints might not return JSON; keep data = null
    }

    if (!resp.ok) {
        const msg =
            (data && (data.message || data.error)) ||
            `Request failed (${resp.status})`;
        throw new Error(msg);
    }

    return data;
}