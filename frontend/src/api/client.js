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

    const { headers: optHeaders, ...rest } = options;

    // Make a mutable headers object
    const headers = {
        "Content-Type": "application/json",
        ...(optHeaders || {}),
    };

    // Attach access token if present
    const token = localStorage.getItem("accessToken");
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const resp = await fetch(url, {
        ...rest,
        credentials: "include",
        headers,
    });

    let data = null;

    try {
        data = await resp.json();
    } catch (err) {
        console.debug("No JSON body in response");
    }

    if (!resp.ok) {
        const msg = (data && (data.message || data.error)) || `Request failed (${resp.status})`;
        const err = new Error(msg);
        err.status = resp.status;
        err.data = data;
        throw err;
    }

    return data;
}