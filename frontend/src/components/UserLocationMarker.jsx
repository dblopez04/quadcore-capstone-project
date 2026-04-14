import { useEffect, useRef, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";

export default function UserLocationMarker({
    autoCenter = true,
    zoom = 16,
    onLocationFound,
}) {
    const map = useMap();
    const [pos, setPos] = useState(null);
    const [err, setErr] = useState("");
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setErr("Geolocation is not supported by this browser.");
            return;
        }

        const onSuccess = (p) => {
            const next = { lat: p.coords.latitude, lng: p.coords.longitude };
            setPos(next);
            setErr("");

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

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3000,
        });

        return () => {
            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [map, autoCenter, zoom, onLocationFound]);

    if (!pos && !err) return null;
    if (err) return null;

    return (
        <Marker position={[pos.lat, pos.lng]}>
            <Popup>
                <div style={{ fontWeight: 600 }}>You are here</div>
                <div style={{ fontSize: 12 }}>
                    lat: {pos.lat.toFixed(5)}, lng: {pos.lng.toFixed(5)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    Live tracking enabled
                </div>
            </Popup>
        </Marker>
    );
}
