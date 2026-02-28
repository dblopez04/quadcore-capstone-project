// frontend/src/utils/recentSearches.js
// Keeps a short list of recent search terms in localStorage.

const KEY = "recentSearches_v1";
const MAX = 5;

export function getRecentSearches() {
    try {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(term) {
    const value = String(term || "").trim();
    if (!value) return;

    const current = getRecentSearches();

    // de-dupe (case-insensitive), then put newest on top
    const next = [
        value,
        ...current.filter((t) => t.toLowerCase() !== value.toLowerCase()),
    ].slice(0, MAX);

    localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearRecentSearches() {
    localStorage.removeItem(KEY);
}