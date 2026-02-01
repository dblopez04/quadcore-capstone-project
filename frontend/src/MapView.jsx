import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import UserLocationMarker from "./components/UserLocationMarker";


export default function MapView({ target }) {
    // UNT-ish coords; any valid [lat, lng] works
    const defaultPosition = [33.2106, -97.1528]; // UNT
    const position = target?.lat && target?.lon
        ? [target.lat, target.lon]
        : defaultPosition;

    // Full viewport so it’s visible
    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <MapContainer
                center={position}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <UserLocationMarker autoCenter={false} />
                <Marker position={position}>
                    <Popup>{target?.name || "University of North Texas"}</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}
