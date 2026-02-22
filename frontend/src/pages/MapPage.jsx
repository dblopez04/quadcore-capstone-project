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

    // Static map only (no interactions needed yet)
    return (
        <>
            <button
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
                style={{ margin: "10px" }}
            >
                Route to selected location
            </button>


            <MapView
                target={target}
                route={route}
                onUserLocation={setUserLocation}
            />

        </>
    );

}
