import MapView from "../MapView";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLocationById } from "../api/locationService";


export default function MapPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const placeId = searchParams.get("place");
    const qLat = searchParams.get("lat");
    const qLng = searchParams.get("lng");
    const qName = searchParams.get("name");
    const [placeTarget, setPlaceTarget] = useState(null);
    const [placeError, setPlaceError] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [route, setRoute] = useState(null);

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

    const queryTarget =
        qLat && qLng
            ? {
                lat: Number(qLat),
                lng: Number(qLng),
                name: qName || "Event",
            }
            : null;

    const rawTarget = queryTarget ?? placeTarget ?? location.state ?? null;

    const target = rawTarget && rawTarget.lat != null
        ? {
            lat: rawTarget.lat,
            lng: rawTarget.lng ?? rawTarget.lon,
            name: rawTarget.name,
            id: rawTarget.id,
        }
        : null;

    return (
        <div className="map-page">
            <div style={{ position: "relative" }}>
                {placeError && (
                    <div
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            zIndex: 1000,
                            maxWidth: 320,
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "rgba(120, 0, 0, 0.92)",
                            color: "white",
                            fontSize: 14,
                        }}
                    >
                        {placeError}
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (!target || !userLocation) {
                            alert("Please make sure your location and a destination are selected.");
                            return;
                        }

                        setRoute({
                            start: userLocation,
                            end: { lat: target.lat, lng: target.lng },
                        });
                    }}
                    style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        zIndex: 1000,
                        width: "auto",
                        padding: "10px 14px",
                        borderRadius: 10,
                    }}
                >
                    Route to selected location
                </button>

                <MapView target={target} route={route} onUserLocation={setUserLocation} />
            </div>
        </div>
    );
}
