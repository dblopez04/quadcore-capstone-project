// frontend/src/api/auth.js
import { API_BASE_URL } from "./client";

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
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
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
    console.log("Password reset requested for:", email);

    await new Promise((res) => setTimeout(res, 600));

    return { message: "Reset email sent (mock)." };
}
