import { useEffect } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import UserLocationMarker from "./components/UserLocationMarker";

function RouteViewport({ routeGeometry, target, userLocation }) {
    const map = useMap();

    useEffect(() => {
        if (routeGeometry?.type === "LineString" && Array.isArray(routeGeometry.coordinates) && routeGeometry.coordinates.length > 1) {
            const bounds = routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]);
            map.fitBounds(bounds, { padding: [48, 48] });
            return;
        }

        if (target?.lat && target?.lng) {
            map.setView([target.lat, target.lng], 16, { animate: true });
            return;
        }

        if (userLocation?.lat && userLocation?.lng) {
            map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
        }
    }, [map, routeGeometry, target, userLocation]);

    return null;
}

function MapClickPicker({ activePickMode, onMapPick }) {
    useMapEvents({
        click(event) {
            if (!activePickMode || !onMapPick) {
                return;
            }

            onMapPick({
                lat: event.latlng.lat,
                lng: event.latlng.lng,
            });
        },
    });

    return null;
}

export default function MapView({
    target,
    route,
    routeGeometry,
    wellLitPaths,
    showWellLitPaths = false,
    onUserLocation,
    onLocationStatusChange,
    onMapPick,
    activePickMode,
    followUser = false,
}) {
    const defaultPosition = [33.2106, -97.1528];
    const position = target?.lat && target?.lng
        ? [target.lat, target.lng]
        : defaultPosition;

    return (
        <div style={{ height: "calc(100vh - 60px)", width: "100%", display: "block" }}>
            <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickPicker activePickMode={activePickMode} onMapPick={onMapPick} />
                <RouteViewport routeGeometry={routeGeometry} target={target} userLocation={route?.start} />

                <UserLocationMarker
                    autoCenter={followUser}
                    onLocationFound={onUserLocation}
                    onLocationStatusChange={onLocationStatusChange}
                />

                {route?.start && (
                    <Marker position={[route.start.lat, route.start.lng]}>
                        <Popup>{route.start.name || "Route start"}</Popup>
                    </Marker>
                )}

                {target?.lat && target?.lng && (
                    <Marker position={[target.lat, target.lng]}>
                        <Popup>{target?.name || "University of North Texas"}</Popup>
                    </Marker>
                )}

                {routeGeometry && (
                    <GeoJSON
                        data={routeGeometry}
                        style={{
                            color: "#006A31",
                            weight: 6,
                            opacity: 0.95,
                        }}
                    />
                )}

                {showWellLitPaths && wellLitPaths && (
                    <GeoJSON
                        data={wellLitPaths}
                        style={{
                            color: "#f97316",
                            weight: 4,
                            opacity: 0.9,
                            dashArray: "10 6",
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}
