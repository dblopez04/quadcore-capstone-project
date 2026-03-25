// src/api/eventService.js
import { apiRequest } from "./client";

/**
 * Fetch events with optional filters.
 * Backend: GET /api/events
 * Query params supported: q, start, end, event_type, status, location_id, organizer_id, tags
 */
export async function fetchEvents(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const v = String(value).trim();
        if (!v) return;
        params.set(key, v);
    });

    const qs = params.toString();
    const url = qs ? `/api/events?${qs}` : `/api/events`;

    // apiRequest should already have baseURL + credentials/cookies set up
    return apiRequest(url, { method: "GET" });
}

export async function registerForEvent(eventId) {
    return apiRequest(`/api/events/${eventId}/register`, {
        method: "POST",
    });
}

export async function fetchBookmarkedEvents(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const v = String(value).trim();
        if (!v) return;
        params.set(key, v);
    });

    const qs = params.toString();
    const url = qs ? `/api/events/bookmarks?${qs}` : `/api/events/bookmarks`;

    return apiRequest(url, { method: "GET" });
}

export async function bookmarkEvent(eventId) {
    return apiRequest(`/api/events/${eventId}/bookmark`, {
        method: "POST",
    });
}

export async function removeBookmarkedEvent(eventId) {
    return apiRequest(`/api/events/${eventId}/bookmark`, {
        method: "DELETE",
    });
}

export async function fetchReminders(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const v = String(value).trim();
        if (!v) return;
        params.set(key, v);
    });

    const qs = params.toString();
    const url = qs ? `/api/events/reminders?${qs}` : `/api/events/reminders`;

    return apiRequest(url, { method: "GET" });
}

export async function createReminder(eventId, payload) {
    return apiRequest(`/api/events/${eventId}/reminders`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function deleteReminder(reminderId) {
    return apiRequest(`/api/events/reminders/${reminderId}`, {
        method: "DELETE",
    });
}
