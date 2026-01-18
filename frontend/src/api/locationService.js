// frontend/src/api/locationService.js
import { mockLocations } from "./mockLocations";

export async function searchLocations(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];

    // Optional: simulate API latency
    await new Promise((r) => setTimeout(r, 150));

    return mockLocations
        .filter((loc) => loc.name.toLowerCase().includes(q))
        .slice(0, 10);
}
