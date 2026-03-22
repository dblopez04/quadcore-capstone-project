import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { searchLocations } from "../api/locationService";

export default function Bookmarks() {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    async function loadBookmarks() {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("/api/locations/bookmarks");
            const list = Array.isArray(data) ? data : (data.bookmarks || data.results || []);

            const enriched = await Promise.all(
                list.map(async (b) => {
                    // If backend already included full location, keep it
                    if (b.location?.coordinates) return b;

                    // Try to recover location using bookmark name
                    const query = (b.custom_name || "").trim();
                    if (!query) return b;

                    try {
                        const results = await searchLocations(query);
                        const first = results?.[0];
                        if (!first?.id || first.lat == null || first.lng == null) return b;

                        // Build a "location" object in the same shape your app expects
                        const recoveredLocation = {
                            location_id: first.id,
                            name: first.name,
                            coordinates: {
                                type: "Point",
                                coordinates: [first.lng, first.lat], // GeoJSON is [lng, lat]
                            },
                        };

                        return { ...b, location: recoveredLocation };
                    } catch {
                        return b;
                    }
                })
            );

            setBookmarks(enriched);
        } catch (err) {
            console.error("Failed to load bookmarks:", err);
            setBookmarks([]);
            setError(err.message || "Failed to load bookmarks.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBookmarks();
    }, []);

    async function handleRemove(bookmark) {
        try {
            const locationId =
                bookmark?.location?.location_id ||
                bookmark?.location_id ||
                bookmark?.locationId;

            if (!locationId) {
                alert("Missing location id for this bookmark.");
                return;
            }

            await apiRequest(`/api/locations/${locationId}/bookmark`, { method: "DELETE" });
            await loadBookmarks();
        } catch (err) {
            console.error("Remove failed:", err);
        }
    }

    function getLatLng(coords) {
        if (!coords) return { lat: null, lng: null };

        // GeoJSON Point: { type: "Point", coordinates: [lon, lat] }
        if (Array.isArray(coords.coordinates) && coords.coordinates.length >= 2) {
            const [lon, lat] = coords.coordinates;
            return { lat, lng: lon };
        }

        // Fallbacks (if backend ever sends plain lat/lng)
        const lat = coords.lat ?? coords.latitude ?? null;
        const lng = coords.lng ?? coords.lon ?? coords.longitude ?? null;
        return { lat, lng };
    }

    function handleOpen(bookmark) {
        const loc = bookmark?.location || bookmark?.Location;

        // 1) Best path: backend-provided deep link (/map?place=...)
        if (loc?.share_url) {
            try {
                const u = new URL(loc.share_url); // share_url is full http://localhost:5173/map?place=...
                navigate(`${u.pathname}${u.search}`); // => /map?place=...
                return;
            } catch (e) {
                // If share_url isn't a full URL for some reason, try it as a relative path
                navigate(loc.share_url);
                return;
            }
        }

        // 2) Fallback: use coordinates
        const coords = loc?.coordinates;

        let lat = null;
        let lng = null;

        // GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
        if (coords?.type === "Point" && Array.isArray(coords.coordinates) && coords.coordinates.length >= 2) {
            lng = coords.coordinates[0];
            lat = coords.coordinates[1];
        } else {
            // fallback for old shapes
            lat = coords?.lat ?? coords?.latitude ?? null;
            lng = coords?.lng ?? coords?.lon ?? coords?.longitude ?? null;
        }

        if (lat == null || lng == null) {
            alert("This bookmark has no coordinates to open on map.");
            return;
        }

        const name = bookmark?.custom_name || loc?.name || "Bookmarked location";
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng), name });

        navigate(`/map?${params.toString()}`);
    }

    return (
        <div className="page">
            <div className="container">
                <div className="panel" style={{ padding: 18 }}>
                    <h2 className="h2" style={{ marginBottom: 12 }}>Bookmarks</h2>

                    <div style={{ marginTop: 14, marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <button className="btn-primary btn" style={{ width: "auto" }} disabled>
                                + New Bookmark
                            </button>
                            <button className="btn" style={{ width: "auto" }} disabled>
                                Import
                            </button>
                        </div>

                        {loading && <div style={{ color: "var(--muted)" }}>Loading bookmarks...</div>}
                        {error && <div style={{ color: "crimson" }}>{error}</div>}

                        {!loading && !error && (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {bookmarks.length === 0 && (
                                    <li style={{ padding: "10px 0", color: "var(--muted)" }}>
                                        No bookmarks saved yet.
                                    </li>
                                )}

                                {bookmarks.map((b) => {
                                    const loc = b.location;
                                    const title = b.custom_name || loc?.name || "Untitled bookmark";
                                    const subtitle = b.notes || loc?.description || "";

                                    const coords = loc?.coordinates;

                                    const hasCoords =
                                        (coords?.type === "Point" && Array.isArray(coords?.coordinates) && coords.coordinates.length >= 2) ||
                                        (coords?.lat != null || coords?.latitude != null) &&
                                        (coords?.lng != null || coords?.lon != null || coords?.longitude != null);

                                    return (
                                        <li
                                            key={b.location_bookmark_id || b.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "10px 0",
                                                borderBottom: "1px solid var(--border)",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{title}</div>
                                                {subtitle && (
                                                    <div style={{ color: "var(--muted)", fontSize: 14 }}>
                                                        {subtitle}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ width: "auto" }}
                                                    disabled={!hasCoords}
                                                    onClick={() => handleOpen(b)}
                                                >
                                                    Open
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ width: "auto" }}
                                                    onClick={() => handleRemove(b)}
                                                >
                                                    Remove
                                                </button>   
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* History section: keep the UI, but disable until backend supports it */}
                    <h2 className="h2" style={{ marginTop: 20, marginBottom: 12 }}>
                        History
                    </h2>

                    <div className="panel">
                        <div style={{ color: "var(--muted)" }}>
                            History → Bookmark is not wired yet (backend-dependent). Coming next sprint.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}