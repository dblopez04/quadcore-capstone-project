// frontend/src/api/eventService.js

const API_BASE = "http://localhost:4000";

async function refreshAccessToken() {
    await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
    });
}

export async function getEvents() {
    let response = await fetch(`${API_BASE}/api/events/bookmarks`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });

    //  If accessToken is missing/expired, refresh then retry once
    if (response.status === 401 || response.status === 403) {
        await refreshAccessToken();

        response = await fetch(`${API_BASE}/api/events/bookmarks`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch events");
    }

    return data.events; // backend returns { events: [...] }
}


export async function getEventsByDate(dateStr) {
    const events = await getEvents();
    return events.filter((e) =>
        e.start_date_time.startsWith(dateStr)
    );
}

// search (frontend-side)
export async function searchEvents(query) {
    const events = await getEvents();
    const q = (query || "").trim().toLowerCase();
    if (!q) return events;

    return events.filter((e) =>
        e.title.toLowerCase().includes(q)
    );
}
