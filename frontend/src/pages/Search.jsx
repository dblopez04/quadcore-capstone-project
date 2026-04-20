// src/pages/Search.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchLocations } from "../api/locationService";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "../utils/recentSearches";
import { useToast } from "../components/ToastProvider";
import { apiRequest } from "../api/client";
import { isGuestMode } from "../utils/authMode";

const pageShellStyle = {
    padding: "32px 20px 48px",
    background: "#f4f7f6",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
};

const searchCardStyle = {
    maxWidth: 980,
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: 24,
    boxShadow: "0 12px 32px rgba(16, 24, 40, 0.08)",
    padding: "32px",
};

const brandHeaderStyle = {
    textAlign: "center",
    marginBottom: 20,
};

const tabsWrapStyle = {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    margin: "10px 0 30px",
};

const contentStackStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 24,
};

const sectionStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
};

const sectionTitleStyle = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#101828",
};

const sectionSubtitleStyle = {
    margin: 0,
    fontSize: 15,
    color: "#667085",
    lineHeight: 1.6,
};

const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#344054",
};

const selectStyle = {
    width: "100%",
    border: "1px solid #d0d5dd",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 15,
    background: "#fff",
    color: "#101828",
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
};

const subtleCardStyle = {
    border: "1px solid #eaecf0",
    borderRadius: 18,
    padding: "18px",
    background: "#fcfcfd",
};

const recentHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
};

const recentChipStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #d0d5dd",
    background: "#ecfdf3",
    color: "#027a48",
    fontWeight: 600,
    cursor: "pointer",
};

const clearBtnStyle = {
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    borderRadius: 999,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 600,
};

const resultCardModernStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 18px",
    border: "1px solid #eaecf0",
    borderRadius: 18,
    background: "#ffffff",
    boxShadow: "0 6px 18px rgba(16, 24, 40, 0.06)",
};

const filterRowStyle = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
};

const filterBtnBaseStyle = {
    borderRadius: 999,
    padding: "10px 16px",
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
};

const filterBtnActiveStyle = {
    background: "#e7f6ec",
    border: "1px solid #079455",
    color: "#067647",
};

const statusBoxStyle = {
    border: "1px solid #eaecf0",
    borderRadius: 16,
    padding: "16px 18px",
    background: "#f9fafb",
    color: "#667085",
    fontSize: 14,
};

const routesCardStyle = {
    border: "1px solid #eaecf0",
    borderRadius: 20,
    padding: "24px",
    background: "#fcfcfd",
    boxShadow: "0 4px 14px rgba(16, 24, 40, 0.04)",
};

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
    const [bookmarkLists, setBookmarkLists] = useState([]);
    const [selectedListId, setSelectedListId] = useState("");

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
                const [bookmarkData, listData] = await Promise.all([
                    apiRequest("/api/locations/bookmarks"),
                    apiRequest("/api/locations/lists"),
                ]);

                const bookmarkList = Array.isArray(bookmarkData)
                    ? bookmarkData
                    : (bookmarkData.bookmarks || bookmarkData.results || []);

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

                const lists = Array.isArray(listData?.lists) ? listData.lists : [];

                if (!cancelled) {
                    setBookmarkedIds(ids);
                    setBookmarkLists(lists);
                }
            } catch (err) {
                console.error("Failed to load bookmarked ids:", err);
                if (!cancelled) {
                    setBookmarkedIds(new Set());
                    setBookmarkLists([]);
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
            // If a list is selected, also add to that list
            if (selectedListId) {
                try {
                    await apiRequest(`/api/locations/lists/${selectedListId}/items`, {
                        method: "POST",
                        body: JSON.stringify({ location_id: id }),
                    });
                } catch (err) {
                    console.error("Failed to add to list:", err);
                }
            }

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
        <div className="page" style={pageShellStyle}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                <header style={brandHeaderStyle}>
                    <img src="/UNT-logo.png" alt="UNT" style={{ height: 44, marginBottom: 8 }} />
                </header>

                {/* Tabs */}
                <div style={tabsWrapStyle} className="tabs" role="tablist" aria-label="Search tabs">
                    <button
                        className={`tab ${tab === "search" ? "active" : ""}`}
                        style={{ padding: "8px 18px" }}
                        role="tab"
                        aria-selected={tab === "search"}
                        onClick={() => setTab("search")}
                    >
                        Search
                    </button>
                    <button
                        className={`tab ${tab === "routes" ? "active" : ""}`}
                        style={{ padding: "8px 18px" }}
                        role="tab"
                        aria-selected={tab === "routes"}
                        onClick={() => setTab("routes")}
                    >
                        Routes
                    </button>
                </div>

                <main
                    style={{
                        maxWidth: 900,
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 28,
                    }}
                >
                    {tab === "search" && (
                        <>
                            {/* Search input */}
                            <div style={sectionStyle}>
                                <h2 style={sectionTitleStyle}>Search Campus</h2>
                                <p style={sectionSubtitleStyle}>
                                    Find buildings, dining, parking, and more across UNT.
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "14px 16px",
                                        borderRadius: 18,
                                        background: "#ffffff",
                                        boxShadow: "0 6px 18px rgba(16, 24, 40, 0.06)",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 34,
                                            height: 34,
                                            borderRadius: 999,
                                            background: "#f2f4f7",
                                            fontSize: "16px",
                                        }}
                                    >
                                        🔍
                                    </span>

                                    <input
                                        type="text"
                                        className="search-plain-input"
                                        placeholder="Search for buildings or locations..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        style={{
                                            all: "unset",
                                            flex: 1,
                                            width: "100%",
                                            fontSize: "18px",
                                            lineHeight: "28px",
                                            color: "#101828",
                                            padding: "8px 4px",
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
                                                border: "none",
                                                background: "#f2f4f7",
                                                cursor: "pointer",
                                                width: 34,
                                                height: 34,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                            title="Clear search"
                                        >
                                            <span style={{ fontSize: "16px", color: "#667085" }}>×</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!guestMode && bookmarkLists.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <label
                                        htmlFor="bookmark-list-select"
                                        style={labelStyle}
                                    >
                                        Save new bookmarks to list
                                    </label>
                                    <select
                                        id="bookmark-list-select"
                                        value={selectedListId}
                                        onChange={(e) => setSelectedListId(e.target.value)}
                                        style={selectStyle}
                                    >
                                        <option value="">All Bookmarks only</option>
                                        {bookmarkLists.map((list) => (
                                            <option key={list.list_id} value={list.list_id}>
                                                {list.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {/* Recent searches */}
                            {recentSearches.length > 0 && (
                                <div style={subtleCardStyle}>
                                    <div style={recentHeaderStyle}>
                                        <h4 style={{ margin: 0 }}>Recent Searches</h4>
                                        <button
                                            type="button"
                                            style={clearBtnStyle}
                                            onClick={() => {
                                                clearRecentSearches();
                                                setRecentSearches([]);
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        {recentSearches.map((term) => (
                                            <button
                                                key={term}
                                                type="button"
                                                style={recentChipStyle}
                                                onClick={() => setQuery(term)}
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
                                            style={resultCardModernStyle}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 12px 28px rgba(16, 24, 40, 0.12)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0px)";
                                                e.currentTarget.style.boxShadow = "0 6px 18px rgba(16, 24, 40, 0.06)";
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
                                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#101828" }}>
                                                    {loc.name}
                                                </div>

                                                <div style={{ fontSize: "12px", color: "#667085", marginTop: 4 }}>
                                                    {isBookmarked ? "Saved in bookmarks" : "Tap to view on map"}
                                                </div>
                                            </button>

                                            {/* Bookmark */}
                                            <button
                                                className="btn"
                                                style={{
                                                    width: "auto",
                                                    marginLeft: 12,
                                                    padding: window.innerWidth < 500 ? "6px 10px" : "10px 14px",
                                                    fontSize: window.innerWidth < 500 ? "12px" : "14px",
                                                    borderRadius: 10,
                                                    background: isBookmarked ? "var(--unt-green)" : "#f8fafc",
                                                    color: isBookmarked ? "#fff" : "#344054",
                                                    border: isBookmarked ? "1px solid var(--unt-green)" : "1px solid #d0d5dd",
                                                    fontWeight: 700,
                                                    boxShadow: isBookmarked ? "0 6px 14px rgba(0,106,49,0.18)" : "none",
                                                    flexShrink: 0,
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
                            <div style={sectionStyle}>
                                <h3 style={{ margin: 0, color: "#667085" }}>Filters</h3>

                                <div style={filterRowStyle}>
                                    {filters.map((f) => {
                                        const isActive = activeFilter === f;

                                        return (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setActiveFilter(isActive ? "" : f)}
                                                style={{
                                                    ...filterBtnBaseStyle,
                                                    ...(isActive ? filterBtnActiveStyle : {}),
                                                }}
                                            >
                                                {isActive ? "✓" : "+"} {f}
                                            </button>
                                        );
                                    })}
                                </div>

                                {activeFilter && (
                                    <div style={{ fontSize: 14, color: "#667085" }}>
                                        Active filter: <strong>{activeFilter}</strong>
                                    </div>
                                )}
                            </div>
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
        </div>
    );
}