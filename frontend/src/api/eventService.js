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
export async function fetchRegisteredEvents() {
    return apiRequest("/api/events/registrations", {
        method: "GET",
    });
}
export async function unregisterFromEvent(eventId) {
    return apiRequest(`/api/events/${eventId}/register`, {
        method: "DELETE",
    });
}