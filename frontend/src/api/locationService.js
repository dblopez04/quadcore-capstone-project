// frontend/src/api/locationService.js
import { apiRequest } from "./client";
import { mockLocations } from "./mockLocations";

// Turns Postgres GEOMETRY(Point,4326) into { lat, lng } for the frontend.
// Sequelize usually returns: { type: "Point", coordinates: [lng, lat] }
function parseCoords(geom) {
    const coords = geom && Array.isArray(geom.coordinates) ? geom.coordinates : null;
    if (!coords || coords.length < 2) return { lat: null, lng: null };
    return { lng: coords[0], lat: coords[1] };
}

// Backend /api/search returns results with { title, coordinates, location_id, result_id, result_type }
function mapSearchResults(payload) {
    const results = Array.isArray(payload?.results) ? payload.results : [];

    return results
        // for now we only show locations on the Search page (POIs can come next)
        .filter((r) => r.result_type === "location" && r.location_id)
        .map((r) => {
            const { lat, lng } = parseCoords(r.coordinates);
            return {
                id: r.location_id,
                name: r.title,
                lat,
                lng,
            };
        })
        // hide anything missing coords so we don’t send the map to nowhere
        .filter((x) => x.lat !== null && x.lng !== null);
}

export async function searchLocations(query) {
    const q = (query || "").trim();
    if (!q) return [];

    // Try backend first
    try {
        const data = await apiRequest(`/api/search?q=${encodeURIComponent(q)}&types=location&limit=10`);
        return mapSearchResults(data);
    } catch (err) {
        // If backend is down or errors, fallback so the UI still works.
        console.warn("Search API failed, using mock data:", err?.message || err);
        const lower = q.toLowerCase();
        return mockLocations
            .filter((loc) => loc.name.toLowerCase().includes(lower))
            .slice(0, 10);
    }
}