import { useEffect, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";

export default function UserLocationMarker({
    autoCenter = true,
    zoom = 16,
    onLocationFound,
}) {
    const map = useMap();
    const [pos, setPos] = useState(null); // {lat, lng}
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setErr("Geolocation is not supported by this browser.");
            return;
        }

        const onSuccess = (p) => {
            const next = { lat: p.coords.latitude, lng: p.coords.longitude };
            setPos(next);
            if (onLocationFound) {
                onLocationFound(next);
            }

            if (autoCenter) {
                map.setView([next.lat, next.lng], zoom, { animate: true });
            }
        };

        const onError = (e) => {
            // Common: user denies permission
            setErr(e?.message || "Unable to get your location.");
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
        });
    }, [map, autoCenter, zoom]);

    // Optional: show nothing if no location
    if (!pos && !err) return null;

    // If denied/error: don't break the map; show a small popup marker at default? We'll just render nothing.
    if (err) return null;

    return (
        <Marker position={[pos.lat, pos.lng]}>
            <Popup>
                <div style={{ fontWeight: 600 }}>You are here</div>
                <div style={{ fontSize: 12 }}>
                    lat: {pos.lat.toFixed(5)}, lng: {pos.lng.toFixed(5)}
                </div>
            </Popup>
        </Marker>
    );
}
