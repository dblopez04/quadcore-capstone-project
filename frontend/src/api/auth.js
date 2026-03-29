// frontend/src/api/auth.js
import { buildApiUrl } from "./client";

async function handleResponse(response, defaultErrorMessage) {
    let data = {};
    try {
        data = await response.json();
    } catch {
        // ignore JSON errors, will fall back to default message
    }

    if (!response.ok) {
        throw new Error(data.message || defaultErrorMessage);
    }

    return data;
}

export async function loginRequest(email, password) {
    const response = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include", // send/receive cookies
        body: JSON.stringify({ email, password }),
    });

    return handleResponse(response, "Login failed");
}

export async function registerRequest(payload) {
    const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    return handleResponse(response, "Registration failed");
}

export async function logoutRequest() {
    const response = await fetch(buildApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        // ignore JSON parse errors
    }

    // Backend currently requires auth on logout; treat unauthenticated
    // responses as a no-op so "continue as guest" can proceed cleanly.
    if (!response.ok && response.status !== 401 && response.status !== 403) {
        throw new Error(data.message || "Logout failed");
    }

    return data;
}

export async function requestPasswordReset(email) {
    const response = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    return handleResponse(response, "Failed to request password reset");
}

export async function resetPassword(token, newPassword) {
    const response = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
    });

    return handleResponse(response, "Failed to reset password");
}
