import MapView from "../MapView";
import { useLocation } from "react-router-dom";
import { useState } from "react";


export default function MapPage() {
    const location = useLocation();
    const rawTarget = location.state ?? null;
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
