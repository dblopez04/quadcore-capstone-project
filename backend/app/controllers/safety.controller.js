const db = require("../models");

const WellLitPath = db.WellLitPath;

const parseBoolean = (value) => {
    if (value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
};

const toFeature = (path) => ({
    type: "Feature",
    properties: {
        path_id: path.path_id,
        name: path.name,
        path_type: path.path_type,
        lighting_level: path.lighting_level,
        is_preferred: path.is_preferred,
        notes: path.notes,
    },
    geometry: path.geom,
});

exports.getWellLitPaths = async (req, res) => {
    try {
        const { preferred, lighting_level: lightingLevel, path_type: pathType } = req.query;
        const where = {};

        const parsedPreferred = parseBoolean(preferred);
        if (preferred !== undefined && parsedPreferred === null) {
            return res.status(400).send({ message: "preferred must be true or false." });
        }

        if (parsedPreferred !== undefined) {
            where.is_preferred = parsedPreferred;
        }

        if (lightingLevel) {
            where.lighting_level = String(lightingLevel).trim().toUpperCase();
        }

        if (pathType) {
            where.path_type = String(pathType).trim().toUpperCase();
        }

        const paths = await WellLitPath.findAll({
            where,
            order: [["name", "ASC"]],
        });

        res.send({
            paths: paths.map((path) => ({
                path_id: path.path_id,
                name: path.name,
                path_type: path.path_type,
                lighting_level: path.lighting_level,
                is_preferred: path.is_preferred,
                notes: path.notes,
                geometry: path.geom,
            })),
            geojson: {
                type: "FeatureCollection",
                features: paths.map(toFeature),
            },
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving well-lit paths." });
    }
};
