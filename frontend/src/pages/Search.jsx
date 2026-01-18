import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchLocations } from "../api/locationService";

export default function Search() {
    const [tab, setTab] = useState("search");
    const filters = ["Dining", "Parking", "Accessibility Routes", "Well-Lit Paths"];

    // Location search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

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
                if (!cancelled) setResults(data);
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
        navigate(
            `/map?lat=${loc.lat}&lng=${loc.lng}&name=${encodeURIComponent(loc.name)}`
        );
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

                        {/* Status text */}
                        {loading && (
                            <div style={{ marginBottom: 12, color: "#666" }}>Searching…</div>
                        )}

                        {/* Results */}
                        <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
                            {!loading && query.trim() && results.length === 0 && (
                                <li style={{ padding: "10px 0", color: "#666" }}>
                                    No matches found.
                                </li>
                            )}

                            {results.map((loc) => (
                                <li key={loc.id}>
                                    <button
                                        onClick={() => handleSelect(loc)}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "10px 0",
                                            border: "none",
                                            background: "transparent",
                                            borderBottom: "1px solid #eee",
                                            cursor: "pointer",
                                            textAlign: "left",
                                        }}
                                    >
                                        <span>{loc.name}</span>
                                        <span style={{ color: "#555", fontSize: 20 }}>›</span>
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
                        <button
                            className="btn-primary btn"
                            style={{ marginTop: 12, width: "auto" }}
                        >
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
