// frontend/src/api/auth.js

export const API_BASE_URL = "http://localhost:4000"; // adjust if your backend uses a different port or prefix

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
