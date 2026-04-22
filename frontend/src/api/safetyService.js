import { apiRequest } from "./client";

export async function getWellLitPaths(filters = {}) {
    const params = new URLSearchParams();

    if (filters.preferred !== undefined) {
        params.set("preferred", String(filters.preferred));
    }

    if (filters.lightingLevel) {
        params.set("lighting_level", filters.lightingLevel);
    }

    if (filters.pathType) {
        params.set("path_type", filters.pathType);
    }

    const query = params.toString();
    const path = query ? `/api/safety/well-lit-paths?${query}` : "/api/safety/well-lit-paths";
    return await apiRequest(path);
}
