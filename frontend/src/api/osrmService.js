import { apiRequest } from "./client";

function toCoordinateString(point) {
    if (!point || typeof point.lng !== "number" || typeof point.lat !== "number") {
        throw new Error("A valid route point requires numeric lat and lng values.");
    }

    return `${point.lng},${point.lat}`;
}

export async function getRoute({ start, end, profile = "walking" }) {
    const params = new URLSearchParams({
        start: toCoordinateString(start),
        end: toCoordinateString(end),
        profile,
    });

    return await apiRequest(`/api/osrm/route?${params.toString()}`);
}
