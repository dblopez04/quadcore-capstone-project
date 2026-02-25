import MapView from "../MapView";
import { useLocation, useSearchParams } from "react-router-dom";
import { useState } from "react";


export default function MapPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const qLat = searchParams.get("lat");
    const qLng = searchParams.get("lng");
    const qName = searchParams.get("name");

    const queryTarget =
        qLat && qLng
            ? {
                lat: Number(qLat),
                lng: Number(qLng),
                name: qName || "Event",
            }
            : null;

    const rawTarget = queryTarget ?? location.state ?? null;
    const [userLocation, setUserLocation] = useState(null);

    const target = rawTarget && rawTarget.lat != null
        ? {
            lat: rawTarget.lat,
            lng: rawTarget.lng ?? rawTarget.lon,
            name: rawTarget.name,
            id: rawTarget.id,
        }
        : null;


    const [route, setRoute] = useState(null);

    return (
        <div className="map-page">
            <div style={{ position: "relative" }}>
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