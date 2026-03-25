import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import UserLocationMarker from "./components/UserLocationMarker";

function MapCenterController({ position }) {
    const map = useMap();

    useEffect(() => {
        if (!Array.isArray(position) || position.length < 2) {
            return;
        }

        map.setView(position, map.getZoom(), { animate: false });
    }, [map, position]);

    return null;
}

export default function MapView({ target, route, onUserLocation }) {

    // UNT-ish coords; any valid [lat, lng] works
    const defaultPosition = [33.2106, -97.1528]; // UNT
    const position = target?.lat && target?.lng
        ? [target.lat, target.lng]
        : defaultPosition;

    const routePositions =
        route && route.start && route.end
            ? [
                [route.start.lat, route.start.lng],
                [route.end.lat, route.end.lng]
            ]
            : null;


    // Full viewport so it's visible
    return (
        <div style={{ height: "calc(100vh - 60px)", width: "100%", display: "block"}}>
            <MapContainer
                center={position}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterController position={position} />
                {routePositions && <Polyline positions={routePositions} />}


                <UserLocationMarker
                    autoCenter={false}
                    onLocationFound={(latlng) => {
                        onUserLocation(latlng);
                    }}
                />

                <Marker position={position}>
                    <Popup>{target?.name || "University of North Texas"}</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}
