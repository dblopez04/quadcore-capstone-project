const ALLOWED_PROFILES = new Set(["walking", "foot"]);

const isCoordinatePair = (value) => {
    if (typeof value !== "string") {
        return false;
    }

    const parts = value.split(",");
    if (parts.length !== 2) {
        return false;
    }

    const [lon, lat] = parts.map((part) => Number(part.trim()));
    return Number.isFinite(lon) && Number.isFinite(lat);
};

exports.getRoute = async (req, res) => {
    try {
        const { start, end, profile = "walking" } = req.query;

        if (!start || !end) {
            return res.status(400).json({
                success: false,
                error: "Missing 'start' or 'end' query parameters. Format: lon,lat"
            });
        }

        if (!isCoordinatePair(start) || !isCoordinatePair(end)) {
            return res.status(400).json({
                success: false,
                error: "Invalid coordinates. Expected format: lon,lat"
            });
        }

        if (!ALLOWED_PROFILES.has(profile)) {
            return res.status(400).json({
                success: false,
                error: "Unsupported profile. Use 'walking' or 'foot'."
            });
        }

        const normalizedProfile = profile === "foot" ? "walking" : profile;
        const baseUrl = (process.env.OSRM_URL || "http://osrm:5000").replace(/\/$/, "");
        const url = `${baseUrl}/route/v1/${normalizedProfile}/${start};${end}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.routes) || data.routes.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No route found"
            });
        }

        const bestRoute = data.routes[0];

        return res.status(200).json({
            success: true,
            route: {
                distance_meters: bestRoute.distance,
                duration_seconds: bestRoute.duration,
                geometry: bestRoute.geometry
            },
            raw: data
        });
    } catch (err) {
        console.error("OSRM Error:", err.message);
        return res.status(500).json({
            success: false,
            error: "Failed to connect to OSRM",
            details: err.message
        });
    }
};
