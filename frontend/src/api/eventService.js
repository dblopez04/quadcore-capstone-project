// src/api/eventService.js
import { apiRequest } from "./client";

/**
 * Fetch events with optional filters.
 * Backend: GET /api/events
 * Query params supported: q, start, end, event_type, status, location_id
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

export async function fetchEventCategorySubscriptions() {
    return apiRequest("/api/events/category-subscriptions", {
        method: "GET",
    });
}

export async function subscribeToEventCategory(eventType) {
    return apiRequest("/api/events/category-subscriptions", {
        method: "POST",
        body: JSON.stringify({ event_type: eventType }),
    });
}

export async function unsubscribeFromEventCategory(subscriptionId) {
    return apiRequest(`/api/events/category-subscriptions/${subscriptionId}`, {
        method: "DELETE",
    });
}

export async function unregisterFromEvent(eventId) {
    return apiRequest(`/api/events/${eventId}/register`, {
        method: "DELETE",
    });
}

export async function fetchBookmarkedEvents() {
    return apiRequest("/api/events/bookmarks", {
        method: "GET",
    });
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

export async function fetchReminders() {
    return apiRequest("/api/events/reminders", {
        method: "GET",
    });
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
