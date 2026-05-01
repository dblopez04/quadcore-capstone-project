import { useEffect, useRef, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";

function getGeolocationErrorMessage(error) {
    switch (error?.code) {
    case 1:
        return "Location access is blocked in your browser for this site.";
    case 2:
        return "Your device could not determine your current location.";
    case 3:
        return "Timed out while trying to determine your current location.";
    default:
        return error?.message || "Unable to get your location.";
    }
}

export default function UserLocationMarker({
    autoCenter = true,
    zoom = 16,
    onLocationFound,
    onLocationStatusChange,
}) {
    const map = useMap();
    const [pos, setPos] = useState(null);
    const [err, setErr] = useState("");
    const watchIdRef = useRef(null);
    const onLocationFoundRef = useRef(onLocationFound);
    const onLocationStatusChangeRef = useRef(onLocationStatusChange);

    useEffect(() => {
        onLocationFoundRef.current = onLocationFound;
    }, [onLocationFound]);

    useEffect(() => {
        onLocationStatusChangeRef.current = onLocationStatusChange;
    }, [onLocationStatusChange]);

    useEffect(() => {
        let cancelled = false;
        let permissionCleanup = () => {};

        const notifyLocationStatus = (state, message = "") => {
            if (onLocationStatusChangeRef.current) {
                onLocationStatusChangeRef.current({ state, message });
            }
        };

        if (!("geolocation" in navigator)) {
            const message = "Geolocation is not supported by this browser.";
            setErr(message);
            notifyLocationStatus("unsupported", message);
            return;
        }

        notifyLocationStatus("requesting");

        if ("permissions" in navigator && typeof navigator.permissions?.query === "function") {
            navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
                if (cancelled) {
                    return;
                }

                const syncPermissionState = () => {
                    if (permissionStatus.state === "granted") {
                        notifyLocationStatus("granted");
                        return;
                    }

                    if (permissionStatus.state === "denied") {
                        notifyLocationStatus("denied", "Location access is blocked in your browser for this site.");
                        return;
                    }

                    notifyLocationStatus("prompt");
                };

                syncPermissionState();

                const handleChange = () => {
                    if (!cancelled) {
                        syncPermissionState();
                    }
                };

                if (typeof permissionStatus.addEventListener === "function") {
                    permissionStatus.addEventListener("change", handleChange);
                    permissionCleanup = () => {
                        permissionStatus.removeEventListener("change", handleChange);
                    };
                    return;
                }

                permissionStatus.onchange = handleChange;
                permissionCleanup = () => {
                    permissionStatus.onchange = null;
                };
            }).catch(() => {
                notifyLocationStatus("requesting");
            });
        }

        const onSuccess = (p) => {
            const next = { lat: p.coords.latitude, lng: p.coords.longitude };
            setPos(next);
            setErr("");
            notifyLocationStatus("granted");

            if (onLocationFoundRef.current) {
                onLocationFoundRef.current(next);
            }

            if (autoCenter) {
                map.setView([next.lat, next.lng], zoom, { animate: true });
            }
        };

        const onError = (e) => {
            const message = getGeolocationErrorMessage(e);
            setErr(message);
            notifyLocationStatus(e?.code === 1 ? "denied" : "error", message);
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3000,
        });

        return () => {
            cancelled = true;
            permissionCleanup();

            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [map, autoCenter, zoom]);

    if (!pos) return null;

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
                {err && (
                    <div style={{ fontSize: 12, color: "#9f1239", marginTop: 4 }}>
                        {err}
                    </div>
                )}
            </Popup>
        </Marker>
    );
}
