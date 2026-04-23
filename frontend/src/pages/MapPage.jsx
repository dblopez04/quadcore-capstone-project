import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import MapView from "../MapView";
import { getLocationById, searchLocations } from "../api/locationService";
import { getRoute } from "../api/osrmService";
import { getWellLitPaths } from "../api/safetyService";
import { useToast } from "../components/ToastProvider";

function buildRoutePoint(point, fallbackName) {
    if (!point || point.lat == null || point.lng == null) {
        return null;
    }

    return {
        lat: Number(point.lat),
        lng: Number(point.lng),
        name: point.name || fallbackName,
        id: point.id || point.location_id || null,
    };
}

function formatDistance(distanceMeters) {
    if (typeof distanceMeters !== "number") {
        return "";
    }

    if (distanceMeters < 1000) {
        return `${Math.round(distanceMeters)} m`;
    }

    return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function formatDuration(durationSeconds) {
    if (typeof durationSeconds !== "number") {
        return "";
    }

    const totalMinutes = Math.round(durationSeconds / 60);
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function RouteInput({
    label,
    value,
    onChange,
    results,
    onSelect,
    pickMode,
    activePickMode,
    onPickModeToggle,
    onClearRoute,
    placeholder,
}) {
    return (
        <label className="route-field">
            <span className="route-field-label">{label}</span>
            <div className="route-field-row">
                <input
                    className="search-input route-field-input"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => {
                        onChange(event.target.value);
                        onClearRoute();
                    }}
                />
                <button
                    type="button"
                    className={`route-map-pick ${activePickMode === pickMode ? "active" : ""}`}
                    onClick={() => onPickModeToggle(activePickMode === pickMode ? "" : pickMode)}
                >
                    {activePickMode === pickMode ? "Picking..." : "Pick on map"}
                </button>
            </div>
            {results.length > 0 && (
                <div className="route-suggestions">
                    {results.slice(0, 5).map((result) => (
                        <button
                            key={result.id}
                            type="button"
                            className="route-suggestion"
                            onClick={() => onSelect(result)}
                        >
                            <span>{result.name}</span>
                            <span className="route-suggestion-coords">
                                {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </label>
    );
}

export default function MapPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();

    const placeId = searchParams.get("place");
    const qLat = searchParams.get("lat");
    const qLng = searchParams.get("lng");
    const qName = searchParams.get("name");
    const [placeTarget, setPlaceTarget] = useState(null);
    const [placeError, setPlaceError] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [startQuery, setStartQuery] = useState("");
    const [endQuery, setEndQuery] = useState("");
    const [startResults, setStartResults] = useState([]);
    const [endResults, setEndResults] = useState([]);
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [route, setRoute] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [routeSummary, setRouteSummary] = useState(null);
    const [isRouting, setIsRouting] = useState(false);
    const [activePickMode, setActivePickMode] = useState("");
    const [followUser, setFollowUser] = useState(true);
    const [showWellLitPaths, setShowWellLitPaths] = useState(true);
    const [wellLitPaths, setWellLitPaths] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function resolvePlaceTarget() {
            if (!placeId) {
                setPlaceTarget(null);
                setPlaceError("");
                return;
            }

            try {
                setPlaceError("");
                const resolvedLocation = await getLocationById(placeId);
                if (!cancelled) {
                    setPlaceTarget({
                        lat: resolvedLocation.lat,
                        lng: resolvedLocation.lng,
                        name: resolvedLocation.name,
                        id: resolvedLocation.location_id || resolvedLocation.id,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setPlaceTarget(null);
                    setPlaceError(err?.message || "Failed to load selected location.");
                }
            }
        }

        resolvePlaceTarget();

        return () => {
            cancelled = true;
        };
    }, [placeId]);

    const target = useMemo(() => {
        const queryTarget =
            qLat && qLng
                ? {
                    lat: Number(qLat),
                    lng: Number(qLng),
                    name: qName || "Event",
                }
                : null;

        const rawTarget = queryTarget ?? placeTarget ?? location.state ?? null;
        if (!rawTarget || rawTarget.lat == null) {
            return null;
        }

        return {
            lat: rawTarget.lat,
            lng: rawTarget.lng ?? rawTarget.lon,
            name: rawTarget.name,
            id: rawTarget.id,
        };
    }, [qLat, qLng, qName, placeTarget, location.state]);

    useEffect(() => {
        if (!target) {
            return;
        }

        const nextEnd = buildRoutePoint(target, target.name || "Selected destination");
        setEndPoint(nextEnd);
        setEndQuery(nextEnd?.name || "");
        setRoute(null);
        setRouteGeometry(null);
        setRouteSummary(null);
    }, [target]);

    useEffect(() => {
        if (!userLocation || startPoint) {
            return;
        }

        const nextStart = buildRoutePoint(userLocation, "Current location");
        setStartPoint(nextStart);
        setStartQuery(nextStart?.name || "Current location");
    }, [userLocation, startPoint]);

    useEffect(() => {
        let cancelled = false;

        async function runSearch(query, setter) {
            const trimmed = query.trim();
            if (!trimmed) {
                setter([]);
                return;
            }

            try {
                const results = await searchLocations(trimmed);
                if (!cancelled) {
                    setter(results);
                }
            } catch {
                if (!cancelled) {
                    setter([]);
                }
            }
        }

        const timer = setTimeout(() => {
            runSearch(startQuery, setStartResults);
            runSearch(endQuery, setEndResults);
        }, 180);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [startQuery, endQuery]);

    useEffect(() => {
        let cancelled = false;

        async function loadWellLitPaths() {
            try {
                const data = await getWellLitPaths({ preferred: true });
                if (!cancelled) {
                    setWellLitPaths(data.geojson || null);
                }
            } catch {
                if (!cancelled) {
                    setWellLitPaths(null);
                    showToast("Well-lit path overlay is unavailable right now.", "error");
                }
            }
        }

        loadWellLitPaths();

        return () => {
            cancelled = true;
        };
    }, [showToast]);

    function clearRoute() {
        setRoute(null);
        setRouteGeometry(null);
        setRouteSummary(null);
    }

    function selectStart(loc) {
        const next = buildRoutePoint(loc, loc.name || "Start");
        setStartPoint(next);
        setStartQuery(next?.name || "");
        setStartResults([]);
        setActivePickMode("");
        clearRoute();
    }

    function selectEnd(loc) {
        const next = buildRoutePoint(loc, loc.name || "Destination");
        setEndPoint(next);
        setEndQuery(next?.name || "");
        setEndResults([]);
        setActivePickMode("");
        clearRoute();
    }

    function useCurrentLocation() {
        if (!userLocation) {
            showToast("Allow location access, then try again.", "error");
            return;
        }

        const next = buildRoutePoint(userLocation, "Current location");
        setStartPoint(next);
        setStartQuery(next?.name || "Current location");
        setStartResults([]);
        setActivePickMode("");
        clearRoute();
    }

    function handleMapPick(latlng) {
        const pickedPoint = {
            lat: latlng.lat,
            lng: latlng.lng,
            name: `Pinned point (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`,
        };

        if (activePickMode === "start") {
            selectStart(pickedPoint);
            return;
        }

        if (activePickMode === "end") {
            selectEnd(pickedPoint);
        }
    }

    function swapRoutePoints() {
        const currentStart = startPoint;
        const currentEnd = endPoint;
        const currentStartQuery = startQuery;
        const currentEndQuery = endQuery;

        setStartPoint(currentEnd);
        setEndPoint(currentStart);
        setStartQuery(currentEndQuery);
        setEndQuery(currentStartQuery);
        clearRoute();
    }

    async function handleFindRoute() {
        if (!startPoint || !endPoint) {
            showToast("Choose both a start and destination to build a route.", "error");
            return;
        }

        setIsRouting(true);

        try {
            const data = await getRoute({
                start: startPoint,
                end: endPoint,
                profile: "walking",
            });

            setRoute({
                start: startPoint,
                end: endPoint,
            });
            setRouteGeometry(data.route.geometry);
            setRouteSummary({
                distance: data.route.distance_meters,
                duration: data.route.duration_seconds,
            });
        } catch (err) {
            clearRoute();
            showToast(err.message || "Unable to build a route right now.", "error");
        } finally {
            setIsRouting(false);
        }
    }

    return (
        <div className="map-page">
            <div className="map-routing-shell">
                <aside className="route-panel">
                    <div className="route-panel-hero">
                        <div className="route-panel-kicker">Campus directions</div>
                        <h1 className="route-panel-title">Build a walking route across UNT</h1>
                        <p className="route-panel-copy">
                            Search for buildings, pin points on the map, or start from your live location.
                        </p>
                    </div>

                    {placeError && <div className="route-error-note">{placeError}</div>}

                    <RouteInput
                        label="Start"
                        value={startQuery}
                        onChange={setStartQuery}
                        results={startResults}
                        onSelect={selectStart}
                        pickMode="start"
                        activePickMode={activePickMode}
                        onPickModeToggle={setActivePickMode}
                        onClearRoute={clearRoute}
                        placeholder="Current location, building, or pinned point"
                    />

                    <div className="route-actions-row">
                        <button type="button" className="route-chip-btn" onClick={useCurrentLocation}>
                            Use my location
                        </button>
                        <button
                            type="button"
                            className="route-chip-btn"
                            onClick={() => setShowWellLitPaths((current) => !current)}
                        >
                            {showWellLitPaths ? "Hide well-lit paths" : "Show well-lit paths"}
                        </button>
                        <button
                            type="button"
                            className="route-chip-btn"
                            onClick={() => setFollowUser((current) => !current)}
                        >
                            {followUser ? "Following you" : "Follow me"}
                        </button>
                        <button type="button" className="route-chip-btn" onClick={swapRoutePoints}>
                            Swap
                        </button>
                        <button type="button" className="route-chip-btn" onClick={clearRoute}>
                            Clear route
                        </button>
                    </div>

                    <RouteInput
                        label="Destination"
                        value={endQuery}
                        onChange={setEndQuery}
                        results={endResults}
                        onSelect={selectEnd}
                        pickMode="end"
                        activePickMode={activePickMode}
                        onPickModeToggle={setActivePickMode}
                        onClearRoute={clearRoute}
                        placeholder="Building, event, or pinned point"
                    />

                    <div className="route-cta-row">
                        <button
                            type="button"
                            className="btn btn-primary route-cta"
                            onClick={handleFindRoute}
                            disabled={isRouting}
                        >
                            {isRouting ? "Finding route..." : "Find walking route"}
                        </button>
                    </div>

                    <div className="route-status-panel">
                        {routeSummary ? (
                            <>
                                <div className="route-summary-row">
                                    <span className="route-summary-label">Distance</span>
                                    <strong>{formatDistance(routeSummary.distance)}</strong>
                                </div>
                                <div className="route-summary-row">
                                    <span className="route-summary-label">Estimated time</span>
                                    <strong>{formatDuration(routeSummary.duration)}</strong>
                                </div>
                                <div className="route-status-note">
                                    Live route loaded from the OSRM walking network.
                                </div>
                                {showWellLitPaths && wellLitPaths && (
                                    <div className="route-status-note">
                                        Orange dashed lines show your curated well-lit network.
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="route-status-note">
                                {activePickMode
                                    ? `Click anywhere on the map to set the ${activePickMode} point.`
                                    : "Choose start and destination points, then build a route."}
                            </div>
                        )}
                    </div>
                </aside>

                <div className="map-stage">
                    <MapView
                        target={endPoint ?? target}
                        route={route}
                        routeGeometry={routeGeometry}
                        wellLitPaths={wellLitPaths}
                        showWellLitPaths={showWellLitPaths}
                        onUserLocation={setUserLocation}
                        onMapPick={handleMapPick}
                        activePickMode={activePickMode}
                        followUser={followUser}
                    />
                </div>
            </div>
        </div>
    );
}
