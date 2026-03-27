import { buildApiUrl } from "./client";

export async function createEventRequest(payload) {
    const response = await fetch(buildApiUrl("/api/admin/events"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create event");
    }

    return data;
}

export async function fetchAdminEvents() {
    const response = await fetch(buildApiUrl("/api/admin/events"), {
        method: "GET",
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to load admin events");
    }

    return data;
}

export async function deleteAdminEvent(eventId) {
    const response = await fetch(buildApiUrl(`/api/admin/events/${eventId}`), {
        method: "DELETE",
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete event");
    }

    return data;
}

export async function updateAdminEvent(eventId, payload) {
    const response = await fetch(buildApiUrl(`/api/admin/events/${eventId}`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to update event");
    }

    return data;
}
