// frontend/src/api/auth.js
export const API_BASE_URL = "http://localhost:4000";

export async function loginRequest(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    return data;
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Registration failed");
    }

    return data;
}
