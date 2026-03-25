import { apiRequest } from "./client";

export async function fetchProfile() {
    return apiRequest("/api/user/profile", {
        method: "POST",
    });
}

export async function updateProfileEmail(email) {
    return apiRequest("/api/user/profile/email", {
        method: "PATCH",
        body: JSON.stringify({ email }),
    });
}
