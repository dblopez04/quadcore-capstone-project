const { Op } = require("sequelize");
const db = require("../models");

const Location = db.Location;
const PointOfInterest = db.PointOfInterest;

const VALID_TYPES = new Set(["location", "poi"]);
const DEFAULT_TYPES = ["location", "poi"];

const frontendBaseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const buildShareUrl = (locationId) => `${frontendBaseUrl}/map?place=${encodeURIComponent(locationId)}`;

const parseLimit = (value, defaultValue = 20, max = 50) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return null;
    }

    return Math.min(parsed, max);
};

const parseTypes = (value) => {
    if (!value) {
        return DEFAULT_TYPES;
    }

    const parsed = value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    if (parsed.length === 0) {
        return null;
    }

    const uniqueTypes = [...new Set(parsed)];
    const isValid = uniqueTypes.every((item) => VALID_TYPES.has(item));
    if (!isValid) {
        return null;
    }

    return uniqueTypes;
};

const tokenize = (query) => query
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .slice(0, 12);

const safeText = (value) => (typeof value === "string" ? value.toLowerCase() : "");

const countTokenMatches = (tokens, ...fields) => {
    const haystacks = fields.map((field) => safeText(field));
    return tokens.reduce((acc, token) => {
        const found = haystacks.some((field) => field.includes(token));
        return acc + (found ? 1 : 0);
    }, 0);
};

const scoreLocation = (location, tokens, rawQuery) => {
    const name = safeText(location.name);
    const description = safeText(location.description);
    const query = safeText(rawQuery);

    let score = 0;
    score += countTokenMatches(tokens, name) * 7;
    score += countTokenMatches(tokens, description) * 2;

    if (query && name.includes(query)) {
        score += 8;
    }
    if (query && name.startsWith(query)) {
        score += 3;
    }

    return score;
};

const scorePoi = (poi, tokens, rawQuery) => {
    const location = poi.Location || {};
    const poiName = safeText(poi.name);
    const poiDescription = safeText(poi.description);
    const locationName = safeText(location.name);
    const locationDescription = safeText(location.description);
    const category = safeText(poi.category);
    const query = safeText(rawQuery);

    let score = 0;
    score += countTokenMatches(tokens, poiName) * 8;
    score += countTokenMatches(tokens, locationName) * 5;
    score += countTokenMatches(tokens, poiDescription, locationDescription, category) * 2;

    if (query && poiName.includes(query)) {
        score += 10;
    }
    if (query && poiName.startsWith(query)) {
        score += 4;
    }
    if (query && locationName.includes(query)) {
        score += 3;
    }

    return score;
};

const buildLocationResult = (location, score) => ({
    result_type: "location",
    result_id: location.location_id,
    location_id: location.location_id,
    poi_id: null,
    title: location.name,
    subtitle: "Location",
    description: location.description,
    category: null,
    coordinates: location.coordinates,
    share_url: buildShareUrl(location.location_id),
    match_score: score
});

const buildPoiResult = (poi, score) => {
    const location = poi.Location || {};
    return {
        result_type: "poi",
        result_id: poi.poi_id,
        location_id: location.location_id,
        poi_id: poi.poi_id,
        title: poi.name,
        subtitle: location.name ? `${poi.category} at ${location.name}` : poi.category,
        description: poi.description || location.description || null,
        category: poi.category,
        coordinates: location.coordinates || null,
        share_url: location.location_id ? buildShareUrl(location.location_id) : null,
        match_score: score
    };
};

exports.search = async (req, res) => {
    try {
        const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (!rawQuery) {
            return res.status(400).send({ message: "q is required." });
        }

        if (rawQuery.length > 120) {
            return res.status(400).send({ message: "q must be 120 characters or fewer." });
        }

        const limit = parseLimit(req.query.limit);
        if (limit === null) {
            return res.status(400).send({ message: "limit must be a positive integer." });
        }

        const types = parseTypes(req.query.types);
        if (!types) {
            return res.status(400).send({
                message: "types must be a comma-separated list containing location and/or poi."
            });
        }

        const tokens = tokenize(rawQuery);
        if (tokens.length === 0) {
            return res.send({
                query: rawQuery,
                types,
                count: 0,
                results: []
            });
        }

        const candidateLimit = Math.min(Math.max(limit * 6, 60), 300);

        const shouldSearchLocations = types.includes("location");
        const shouldSearchPois = types.includes("poi");

        const locationClauses = tokens.flatMap((token) => ([
            { name: { [Op.iLike]: `%${token}%` } },
            { description: { [Op.iLike]: `%${token}%` } }
        ]));

        const poiClauses = tokens.flatMap((token) => ([
            { name: { [Op.iLike]: `%${token}%` } },
            { description: { [Op.iLike]: `%${token}%` } },
            { category: { [Op.iLike]: `%${token}%` } },
            { building_name: { [Op.iLike]: `%${token}%` } },
            { "$Location.name$": { [Op.iLike]: `%${token}%` } },
            { "$Location.description$": { [Op.iLike]: `%${token}%` } }
        ]));

        const [locations, pois] = await Promise.all([
            shouldSearchLocations
                ? Location.findAll({
                    where: locationClauses.length > 0 ? { [Op.or]: locationClauses } : {},
                    order: [["name", "ASC"]],
                    limit: candidateLimit
                })
                : Promise.resolve([]),
            shouldSearchPois
                ? PointOfInterest.findAll({
                    where: {
                        is_active: true,
                        ...(poiClauses.length > 0 ? { [Op.or]: poiClauses } : {})
                    },
                    include: [{ model: Location, required: true }],
                    order: [["name", "ASC"]],
                    subQuery: false,
                    limit: candidateLimit
                })
                : Promise.resolve([])
        ]);

        const locationResults = locations
            .map((location) => {
                const score = scoreLocation(location, tokens, rawQuery);
                return buildLocationResult(location, score);
            })
            .filter((result) => result.match_score > 0);

        const poiResults = pois
            .map((poi) => {
                const score = scorePoi(poi, tokens, rawQuery);
                return buildPoiResult(poi, score);
            })
            .filter((result) => result.match_score > 0);

        const results = [...poiResults, ...locationResults]
            .sort((a, b) => {
                if (b.match_score !== a.match_score) {
                    return b.match_score - a.match_score;
                }
                return a.title.localeCompare(b.title);
            })
            .slice(0, limit);

        res.send({
            query: rawQuery,
            types,
            count: results.length,
            results
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error running federated search." });
    }
};
