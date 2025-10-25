import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default function MapView() {
    // UNT-ish coords; any valid [lat, lng] works
    const position = [33.2106, -97.1528]

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
                <Marker position={position}>
                    <Popup>University of North Texas</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}
