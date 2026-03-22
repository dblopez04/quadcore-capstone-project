const BOOKMARK_KEY = "bookmarkedLocations";

export function getBookmarks() {
    try {
        return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
    } catch {
        return [];
    }
}

export function isBookmarked(id) {
    return getBookmarks().some((b) => b.id === id);
}

export function addBookmark(location) {
    const bookmarks = getBookmarks();
    if (!bookmarks.some((b) => b.id === location.id)) {
        const updated = [location, ...bookmarks];
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    }
}

export function removeBookmark(id) {
    const updated = getBookmarks().filter((b) => b.id !== id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
}
