import MapView from "../MapView";
import { useLocation } from "react-router-dom";

export default function MapPage() {
    const location = useLocation();
    const target = location.state;

    // Static map only (no interactions needed yet)
    return <MapView />;
}
