// frontend/src/api/locationService.js
import { apiRequest } from "./client";
import { mockLocations } from "./mockLocations";

const MAX_RESULTS = 10;

let cachedLocations = null;
let inFlightLocationsRequest = null;

// Turns Postgres GEOMETRY(Point,4326) into { lat, lng } for the frontend.
// Sequelize usually returns: { type: "Point", coordinates: [lng, lat] }
function parseCoords(geom) {
    const coords = geom && Array.isArray(geom.coordinates) ? geom.coordinates : null;
    if (!coords || coords.length < 2) return { lat: null, lng: null };
    return { lng: coords[0], lat: coords[1] };
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isSubsequence(needle, haystack) {
    if (!needle) return true;
    if (!haystack) return false;

    let i = 0;
    for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
        if (needle[i] === haystack[j]) {
            i += 1;
        }
    }

    return i === needle.length;
}

function levenshteinDistance(a, b, maxDistance) {
    const source = a || "";
    const target = b || "";
    const lenA = source.length;
    const lenB = target.length;

    if (Math.abs(lenA - lenB) > maxDistance) {
        return maxDistance + 1;
    }

    let previous = Array.from({ length: lenB + 1 }, (_, index) => index);
    let current = new Array(lenB + 1);

    for (let i = 1; i <= lenA; i += 1) {
        current[0] = i;
        let minInRow = current[0];

        for (let j = 1; j <= lenB; j += 1) {
            const cost = source[i - 1] === target[j - 1] ? 0 : 1;
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + cost
            );
            if (current[j] < minInRow) {
                minInRow = current[j];
            }
        }

        if (minInRow > maxDistance) {
            return maxDistance + 1;
        }

        [previous, current] = [current, previous];
    }

    return previous[lenB];
}

function scoreToken(queryToken, candidateTokens) {
    let best = 0;
    const typoTolerance = queryToken.length >= 6 ? 2 : 1;

    for (const candidateToken of candidateTokens) {
        if (candidateToken === queryToken) {
            return 28;
        }
        if (candidateToken.startsWith(queryToken)) {
            best = Math.max(best, 22);
            continue;
        }
        if (candidateToken.includes(queryToken)) {
            best = Math.max(best, 16);
            continue;
        }
        if (isSubsequence(queryToken, candidateToken)) {
            best = Math.max(best, 12);
            continue;
        }

        const distance = levenshteinDistance(queryToken, candidateToken, typoTolerance);
        if (distance <= typoTolerance) {
            best = Math.max(best, 10);
        }
    }

    return best;
}

function scoreText(query, candidate) {
    const normalizedQuery = normalizeText(query);
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedQuery || !normalizedCandidate) return 0;

    if (normalizedCandidate === normalizedQuery) {
        return 250;
    }

    let score = 0;

    if (normalizedCandidate.startsWith(normalizedQuery)) {
        score += 135;
    } else if (normalizedCandidate.includes(normalizedQuery)) {
        score += 95;
    }

    const queryTokens = normalizedQuery.split(" ");
    const candidateTokens = normalizedCandidate.split(" ");
    for (const queryToken of queryTokens) {
        score += scoreToken(queryToken, candidateTokens);
    }

    const compactQuery = normalizedQuery.replace(/\s+/g, "");
    const compactCandidate = normalizedCandidate.replace(/\s+/g, "");
    if (isSubsequence(compactQuery, compactCandidate)) {
        score += 15;
    }

    const acronym = candidateTokens.map((token) => token[0]).join("");
    if (compactQuery.length >= 2 && acronym.startsWith(compactQuery)) {
        score += 25;
    }

    return score;
}

function mapLocations(payload) {
    const locations = Array.isArray(payload?.locations) ? payload.locations : [];

    return locations
        .map((loc) => {
            const { lat, lng } = parseCoords(loc.coordinates);
            return {
                id: loc.location_id || loc.id,
                name: loc.name,
                lat,
                lng,
            };
        })
        .filter((loc) => loc.id && loc.name && loc.lat !== null && loc.lng !== null);
}

async function fetchLocations() {
    const data = await apiRequest("/api/locations");
    return mapLocations(data);
}

async function getSearchableLocations() {
    if (Array.isArray(cachedLocations)) {
        return cachedLocations;
    }

    if (!inFlightLocationsRequest) {
        inFlightLocationsRequest = fetchLocations()
            .then((locations) => {
                cachedLocations = locations;
                return locations;
            })
            .finally(() => {
                inFlightLocationsRequest = null;
            });
    }

    try {
        return await inFlightLocationsRequest;
    } catch (err) {
        console.warn("Location API unavailable, using mock locations:", err?.message || err);
        return mockLocations;
    }
}

function scoreLocation(location, query) {
    return scoreText(query, location.name);
}

export async function searchLocations(query) {
    const q = (query || "").trim();
    if (!q) return [];

    const locations = await getSearchableLocations();

    return locations
        .map((location) => ({
            ...location,
            score: scoreLocation(location, q),
        }))
        .filter((location) => location.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.name.localeCompare(b.name);
        })
        .slice(0, MAX_RESULTS)
        .map(({ score, ...location }) => location);
}
