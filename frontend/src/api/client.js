// frontend/src/api/client.js
const fallbackApiBaseUrl = "http://localhost:4000";

function normalizeApiBaseUrl(value) {
    return String(value || "").trim().replace(/\/$/, "");
}

function normalizeApiPath(path) {
    if (!path) return "";

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const baseEndsWithApi = API_BASE_URL.endsWith("/api");
    const pathStartsWithApi = normalizedPath === "/api" || normalizedPath.startsWith("/api/");

    if (baseEndsWithApi && pathStartsWithApi) {
        const trimmedPath = normalizedPath.slice(4);
        return trimmedPath || "/";
    }

    return normalizedPath;
}

export const API_BASE_URL = normalizeApiBaseUrl(
    Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_API_BASE_URL")
        ? import.meta.env.VITE_API_BASE_URL
        : fallbackApiBaseUrl
);

export function buildApiUrl(path) {
    return `${API_BASE_URL}${normalizeApiPath(path)}`;
}

/**
 * Basic JSON request helper:
 * - includes cookies (accessToken/refreshToken)
 * - parses JSON safely
 * - throws readable errors
 */
export async function apiRequest(path, options = {}) {
    const url = buildApiUrl(path);

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
