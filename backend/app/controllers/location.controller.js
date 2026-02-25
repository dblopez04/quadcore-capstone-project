const db = require("../models");
const { Op } = require("sequelize");

const Location = db.Location;
const LocationBookmark = db.LocationBookmark;

const buildLocationSummary = (location) => ({
    location_id: location.location_id,
    name: location.name,
    description: location.description,
    coordinates: location.coordinates
});

const buildBookmarkResponse = (bookmark) => ({
    location_bookmark_id: bookmark.location_bookmark_id,
    custom_name: bookmark.custom_name,
    notes: bookmark.notes,
    is_favorite: bookmark.is_favorite,
    created_at: bookmark.created_at,
    last_visited: bookmark.last_visited,
    location: bookmark.Location ? buildLocationSummary(bookmark.Location) : null
});

const parseBoolean = (value) => {
    if (value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
};

exports.getLocations = async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const locations = await Location.findAll({
            where: whereClause,
            order: [["name", "ASC"]]
        });

        res.send({ locations });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving locations." });
    }
};

exports.getLocationById = async (req, res) => {
    try {
        const location = await Location.findByPk(req.params.locationId);

        if (!location) {
            return res.status(404).send({ message: "Location not found." });
        }

        res.send({ location });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving location." });
    }
};

exports.getBookmarkedLocations = async (req, res) => {
    try {
        const { favorite, search } = req.query;
        const bookmarkWhere = { user_id: req.user_id };

        const parsedFavorite = parseBoolean(favorite);
        if (favorite !== undefined && parsedFavorite === null) {
            return res.status(400).send({ message: "favorite must be true or false." });
        }

        if (parsedFavorite !== undefined) {
            bookmarkWhere.is_favorite = parsedFavorite;
        }

        const locationInclude = {
            model: Location,
            required: true
        };

        if (search) {
            locationInclude.where = {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { description: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const bookmarks = await LocationBookmark.findAll({
            where: bookmarkWhere,
            include: [locationInclude],
            order: [["is_favorite", "DESC"], ["created_at", "DESC"]]
        });

        res.send({ bookmarks: bookmarks.map(buildBookmarkResponse) });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving location bookmarks." });
    }
};

exports.bookmarkLocation = async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const body = req.body || {};
        const location = await Location.findByPk(locationId);

        if (!location) {
            return res.status(404).send({ message: "Location not found." });
        }

        const parsedFavorite = parseBoolean(body.is_favorite);
        if (body.is_favorite !== undefined && parsedFavorite === null) {
            return res.status(400).send({ message: "is_favorite must be true or false." });
        }

        const [bookmark, created] = await LocationBookmark.findOrCreate({
            where: { user_id: req.user_id, location_id: locationId },
            defaults: {
                user_id: req.user_id,
                location_id: locationId,
                custom_name: body.custom_name,
                notes: body.notes,
                is_favorite: parsedFavorite ?? false
            }
        });

        const updates = {};
        if (!created) {
            if (Object.prototype.hasOwnProperty.call(body, "custom_name")) {
                updates.custom_name = body.custom_name;
            }
            if (Object.prototype.hasOwnProperty.call(body, "notes")) {
                updates.notes = body.notes;
            }
            if (Object.prototype.hasOwnProperty.call(body, "is_favorite")) {
                updates.is_favorite = parsedFavorite;
            }

            if (Object.keys(updates).length > 0) {
                await bookmark.update(updates);
            }
        }

        const savedBookmark = await LocationBookmark.findOne({
            where: { user_id: req.user_id, location_id: locationId },
            include: [{ model: Location, required: true }]
        });

        if (!created) {
            const message = Object.keys(updates).length > 0
                ? "Location bookmark updated."
                : "Location already bookmarked.";
            return res.status(200).send({
                message,
                bookmark: buildBookmarkResponse(savedBookmark)
            });
        }

        res.status(201).send({
            message: "Location bookmarked.",
            bookmark: buildBookmarkResponse(savedBookmark)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error bookmarking location." });
    }
};

exports.updateBookmark = async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const body = req.body || {};
        const updateData = {};

        if (Object.prototype.hasOwnProperty.call(body, "custom_name")) {
            updateData.custom_name = body.custom_name;
        }

        if (Object.prototype.hasOwnProperty.call(body, "notes")) {
            updateData.notes = body.notes;
        }

        if (Object.prototype.hasOwnProperty.call(body, "is_favorite")) {
            const parsedFavorite = parseBoolean(body.is_favorite);
            if (parsedFavorite === null) {
                return res.status(400).send({ message: "is_favorite must be true or false." });
            }
            updateData.is_favorite = parsedFavorite;
        }

        if (Object.prototype.hasOwnProperty.call(body, "last_visited")) {
            if (body.last_visited === null) {
                updateData.last_visited = null;
            } else {
                const parsedDate = new Date(body.last_visited);
                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).send({ message: "last_visited must be a valid datetime." });
                }
                updateData.last_visited = parsedDate;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).send({ message: "No bookmark fields provided for update." });
        }

        const [updatedCount] = await LocationBookmark.update(updateData, {
            where: { user_id: req.user_id, location_id: locationId }
        });

        if (updatedCount === 0) {
            return res.status(404).send({ message: "Bookmark not found." });
        }

        const updatedBookmark = await LocationBookmark.findOne({
            where: { user_id: req.user_id, location_id: locationId },
            include: [{ model: Location, required: true }]
        });

        res.send({
            message: "Bookmark updated.",
            bookmark: buildBookmarkResponse(updatedBookmark)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error updating bookmark." });
    }
};

exports.removeBookmark = async (req, res) => {
    try {
        const deleted = await LocationBookmark.destroy({
            where: { user_id: req.user_id, location_id: req.params.locationId }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Bookmark not found." });
        }

        res.send({ message: "Bookmark removed." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error removing bookmark." });
    }
};
