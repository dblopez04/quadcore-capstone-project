// src/pages/Search.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchLocations } from "../api/locationService";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "../utils/recentSearches";
import { useToast } from "../components/ToastProvider";
import { apiRequest } from "../api/client";
import { isGuestMode } from "../utils/authMode";

export default function Search() {
    const [tab, setTab] = useState("search");
    const filters = ["Dining", "Parking", "Accessibility Routes", "Well-Lit Paths"];

    // Location search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [activeFilter, setActiveFilter] = useState("");

    const navigate = useNavigate();
    const { showToast } = useToast();
    const guestMode = isGuestMode();

    // Search as user types
    useEffect(() => {

        if (!query.trim()) {
            setResults([]);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const t = setTimeout(async () => {
            try {
                const data = await searchLocations(query);
                const rawResults = Array.isArray(data) ? data : (data?.results || data?.locations || []);

                let filteredResults = rawResults;

                if (activeFilter) {
                    const keywordMap = {
                        "Dining": ["dining", "cafe", "restaurant", "food"],
                        "Parking": ["parking", "garage"],
                        "Accessibility Routes": ["accessible", "accessibility"],
                        "Well-Lit Paths": ["light", "path"]
                    };

                    const keywords = keywordMap[activeFilter] || [];

                    filteredResults = rawResults.filter((loc) =>
                        keywords.some((word) =>
                            loc.name.toLowerCase().includes(word)
                        )
                    );
                }

                if (!cancelled) setResults(filteredResults);
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setResults([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [query, activeFilter]);

    useEffect(() => {
        if (guestMode) {
            setBookmarkedIds(new Set());
            return;
        }

        let cancelled = false;

        async function loadBookmarkedIds() {
            try {
                const data = await apiRequest("/api/locations/bookmarks");
                const bookmarkList = Array.isArray(data)
                    ? data
                    : (data.bookmarks || data.results || []);

                const ids = new Set(
                    bookmarkList
                        .map((bookmark) =>
                            bookmark?.location_id ||
                            bookmark?.locationId ||
                            bookmark?.location?.location_id ||
                            bookmark?.location?.id
                        )
                        .filter(Boolean)
                );

                if (!cancelled) {
                    setBookmarkedIds(ids);
                }
            } catch (err) {
                console.error("Failed to load bookmarked ids:", err);
                if (!cancelled) {
                    setBookmarkedIds(new Set());
                }
            }
        }

        loadBookmarkedIds();

        return () => {
            cancelled = true;
        };
    }, [guestMode]);


    function handleSelect(loc) {
        addRecentSearch(loc.name);
        setRecentSearches(getRecentSearches());

        navigate("/map", {
            state: {
                // support both shapes (some code uses lng, some uses lon)
                lat: loc.lat ?? loc.coordinates?.lat,
                lng: loc.lng ?? loc.lon ?? loc.coordinates?.lon,
                name: loc.name,
                id: loc.location_id || loc.id, // prefer UUID
            },
        });
    }

    async function handleBookmark(loc) {
        if (guestMode) {
            showToast("Guest users cannot add bookmarks. Sign in to save locations.", "error");
            return;
        }

        try {
            const id = loc.location_id || loc.id; // prefer UUID
            if (!id) {
                showToast("This result is missing a location id.", "error");
                return;
            }

            await apiRequest(`/api/locations/${id}/bookmark`, {
                method: "POST",
                body: JSON.stringify({
                    custom_name: loc.name,
                    notes: null,
                    is_favorite: false,
                }),
            });
            
            setBookmarkedIds((prev) => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            showToast("Saved to bookmarks.", "success");
            
        } catch (err) {
            showToast(err.message || "Failed to save bookmark.", "error");
        }
    }

    async function handleUnbookmark(loc) {
        if (guestMode) {
            showToast("Guest users cannot manage bookmarks.", "error");
            return;
        }

        try {
            const id = loc.location_id || loc.id;
            if (!id) {
                showToast("This result is missing a location id.", "error");
                return;
            }

            await apiRequest(`/api/locations/${id}/bookmark`, {
                method: "DELETE",
            });

            setBookmarkedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });

            showToast("Removed from bookmarks.", "success");
        } catch (err) {
            showToast(err.message || "Failed to remove bookmark.", "error");
        }
    }

    return (
        <div className="page" style={{ padding: 16, fontFamily: "system-ui" }}>
            <header style={{ textAlign: "center", marginBottom: 12 }}>
                <img src="/UNT-logo.png" alt="UNT" style={{ height: 40 }} />
            </header>

            {/* Tabs */}
            <div className="tabs" role="tablist" aria-label="Search tabs">
                <button
                    className={`tab ${tab === "search" ? "active" : ""}`}
                    role="tab"
                    aria-selected={tab === "search"}
                    onClick={() => setTab("search")}
                >
                    Search
                </button>
                <button
                    className={`tab ${tab === "routes" ? "active" : ""}`}
                    role="tab"
                    aria-selected={tab === "routes"}
                    onClick={() => setTab("routes")}
                >
                    Routes
                </button>
            </div>

            <main style={{ maxWidth: 600, margin: "0 auto" }}>
                {tab === "search" && (
                    <>
                        {/* Search input */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "8px 12px",
                                marginBottom: 16,
                            }}
                        >
                            <span style={{ fontSize: 18, marginRight: 8 }}>🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search for building or location"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{
                                    flex: 1,
                                    border: "none",
                                    outline: "none",
                                    fontSize: 16,
                                }}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setResults([]);
                                    }}
                                    style={{
                                        marginLeft: 8,
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        fontSize: 18,
                                        color: "#666",
                                        padding: 0,
                                    }}
                                    title="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Recent searches */}
                        {recentSearches.length > 0 && (
                            <div style={{ marginTop: -8, marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 13, color: "#777" }}>Recent</div>
                                    <button
                                        className="btn"
                                        style={{ width: "auto", padding: "6px 10px" }}
                                        type="button"
                                        onClick={() => {
                                            clearRecentSearches(); // remove from localStorage
                                            setRecentSearches([]); // immediately update UI
                                        }}
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                                    {recentSearches.map((term) => (
                                        <button
                                            key={term}
                                            type="button"
                                            className="pill"
                                            style={{ cursor: "pointer", border: "1px solid var(--border)" }}
                                            onClick={() => setQuery(term)}
                                            title={`Search: ${term}`}
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status text */}
                        {loading && <div style={{ marginBottom: 12, color: "#666" }}>Searching…</div>}
                        {!loading && query.trim() && results.length > 0 && (
                            <div style={{ marginBottom: 12, color: "#666", fontSize: 14 }}>
                                {results.length} result{results.length !== 1 ? "s" : ""} found
                            </div>
                        )}

                        {/* Results */}
                        <ul style={{ listStyle: "none", padding: 0, marginBottom: 24, display: "grid", gap: 10 }}>
                            {!loading && query.trim() && results.length === 0 && (
                                <li style={{ padding: "10px 0", color: "#666" }}>No matches found.</li>
                            )}

                            {results.map((loc) => {
                                console.log(loc);
                                const locId = loc.location_id || loc.id;
                                const isBookmarked = bookmarkedIds.has(locId);

                                return (
                                    <li
                                        key={locId}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "14px 16px",
                                            border: "1px solid rgba(0, 0, 0, 0.08)",
                                            borderRadius: 14,
                                            background: "var(--bg)",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        {/* Select location */}
                                        <button
                                            onClick={() => handleSelect(loc)}
                                            style={{
                                                flex: 1,
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                padding: 0,
                                            }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{loc.name}</div>
                                            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                                                {isBookmarked ? "Saved in bookmarks" : "Tap to view on map"}
                                            </div>
                                        </button>

                                        {/* Bookmark */}
                                        <button
                                            className="btn"
                                            style={{
                                                width: "auto",
                                                marginLeft: 8,
                                                background: isBookmarked ? "var(--unt-green)" : undefined,
                                                color: isBookmarked ? "#fff" : undefined,
                                                border: isBookmarked ? "1px solid var(--unt-green)" : undefined,
                                            }}
                                            onClick={() => (isBookmarked ? handleUnbookmark(loc) : handleBookmark(loc))}
                                            disabled={guestMode}
                                            title={
                                                guestMode
                                                    ? "Sign in to save bookmarks"
                                                    : isBookmarked
                                                        ? "Remove this bookmark"
                                                        : "Save this location"
                                            }
                                        >
                                            {guestMode ? "Sign in to bookmark" : isBookmarked ? "Remove Bookmark" : "Bookmark"}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Filters */}
                        <h3 style={{ color: "#888", marginBottom: 10 }}>Filters</h3>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {filters.map((f) => {
                                const isActive = activeFilter === f;

                                return (
                                    <button
                                        key={f}
                                        type="button"
                                        className="pill"
                                        onClick={() => setActiveFilter(isActive ? "" : f)}
                                        style={{
                                            cursor: "pointer",
                                            border: isActive ? "1px solid var(--unt-green)" : "1px solid var(--border)",
                                            background: isActive ? "rgba(0,106,49,0.12)" : undefined,
                                            fontWeight: isActive ? 700 : 500,
                                        }}
                                        title={isActive ? `Remove ${f} filter` : `Apply ${f} filter`}
                                    >
                                        {isActive ? "✓" : "+"} {f}
                                    </button>
                                );
                            })}
                        </div>
                        {activeFilter && (
                            <div style={{ marginTop: 10, fontSize: 14, color: "#666" }}>
                                Active filter: <strong>{activeFilter}</strong>
                            </div>
                        )}
                    </>
                )}

                {tab === "routes" && (
                    <div className="panel">
                        <h3 style={{ marginTop: 0 }}>Plan a route</h3>
                        <div style={{ display: "grid", gap: 8 }}>
                            <input className="search-input" placeholder="From…" />
                            <input className="search-input" placeholder="To…" />
                        </div>
                        <button className="btn-primary btn" style={{ marginTop: 12, width: "auto" }}>
                            Find Route
                        </button>
                        <div style={{ color: "#777", marginTop: 8, fontSize: 14 }}>
                            Accessibility & well-lit options supported.
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
