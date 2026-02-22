// frontend/src/api/eventService.js
import { mockEvents } from "./mockEvents";

// Later: replacing these with real fetch() calls to the backend.
export async function getEvents() {
    return mockEvents;
}

// Get events for a specific date (YYYY-MM-DD)
export async function getEventsByDate(dateStr) {
    return mockEvents.filter((e) => e.start.startsWith(dateStr));
}

// Simple search by title/category/location
export async function searchEvents(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return mockEvents;

    return mockEvents.filter((e) => {
        return (
            e.title.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            e.locationName.toLowerCase().includes(q)
        );
    });
}
