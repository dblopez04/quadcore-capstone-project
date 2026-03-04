// src/pages/Search.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchLocations } from "../api/locationService";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "../utils/recentSearches";
import { useToast } from "../components/ToastProvider";
import { apiRequest } from "../api/client";

export default function Search() {
    const [tab, setTab] = useState("search");
    const filters = ["Dining", "Parking", "Accessibility Routes", "Well-Lit Paths"];

    // Location search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());

    const navigate = useNavigate();
    const { showToast } = useToast();

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
                if (!cancelled) setResults(Array.isArray(data) ? data : (data?.results || data?.locations || []));
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
    }, [query]);

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
            showToast("Saved to bookmarks.", "success");
            navigate("/bookmarks");
        } catch (err) {
            showToast(err.message || "Failed to save bookmark.", "error");
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

                        {/* Results */}
                        <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
                            {!loading && query.trim() && results.length === 0 && (
                                <li style={{ padding: "10px 0", color: "#666" }}>No matches found.</li>
                            )}

                            {results.map((loc) => (
                                <li
                                    key={loc.location_id || loc.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 0",
                                        borderBottom: "1px solid #eee",
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
                                        {loc.name}
                                    </button>

                                    {/* Bookmark (backend) */}
                                    <button
                                        className="btn"
                                        style={{ width: "auto", marginLeft: 8 }}
                                        onClick={() => handleBookmark(loc)}
                                    >
                                        Bookmark
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Filters */}
                        <h3 style={{ color: "#888", marginBottom: 10 }}>Filters</h3>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {filters.map((f) => (
                                <span key={f} className="pill">
                                    ✓ {f}
                                </span>
                            ))}
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
    );
}