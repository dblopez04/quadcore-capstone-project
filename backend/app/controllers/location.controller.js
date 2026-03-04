const db = require("../models");
const { Op } = require("sequelize");

const Location = db.Location;
const LocationBookmark = db.LocationBookmark;
const LocationList = db.LocationList;
const LocationListItem = db.LocationListItem;
const RecentlyViewedLocation = db.RecentlyViewedLocation;

const frontendBaseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const buildShareUrl = (locationId) => `${frontendBaseUrl}/map?place=${encodeURIComponent(locationId)}`;

const getIncludedLocation = (record) =>
    record?.Location ||
    record?.location ||
    record?.dataValues?.Location ||
    record?.dataValues?.location ||
    null;

const buildLocationSummary = (location) => ({
    location_id: location.location_id,
    name: location.name,
    description: location.description,
    coordinates: location.coordinates,
    share_url: buildShareUrl(location.location_id)
});

const buildBookmarkResponse = (bookmark) => {
    const location = getIncludedLocation(bookmark);

    return {
        location_bookmark_id: bookmark.location_bookmark_id,
        location_id: bookmark.location_id || location?.location_id || null,
        custom_name: bookmark.custom_name,
        notes: bookmark.notes,
        is_favorite: bookmark.is_favorite,
        created_at: bookmark.created_at,
        last_visited: bookmark.last_visited,
        location: location ? buildLocationSummary(location) : null
    };
};

const buildRecentlyViewedResponse = (recentView) => {
    const location = getIncludedLocation(recentView);

    return {
        recent_view_id: recentView.recent_view_id,
        location_id: recentView.location_id || location?.location_id || null,
        viewed_at: recentView.viewed_at,
        location: location ? buildLocationSummary(location) : null
    };
};

const buildListItemResponse = (item) => {
    const location = getIncludedLocation(item);

    return {
        list_item_id: item.list_item_id,
        location_id: item.location_id || location?.location_id || null,
        added_at: item.added_at,
        location: location ? buildLocationSummary(location) : null
    };
};

const buildLocationListResponse = (list) => {
    const items = Array.isArray(list.items)
        ? [...list.items].sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
        : [];

    return {
        list_id: list.list_id,
        name: list.name,
        created_at: list.created_at,
        updated_at: list.updated_at,
        item_count: items.length,
        items: items.map(buildListItemResponse)
    };
};

const parseBoolean = (value) => {
    if (value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
};

const normalizeListName = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 100) {
        return null;
    }

    return trimmed;
};

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

exports.getLocations = async (req, res) => {
    try {
        const locations = await Location.findAll({
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

        res.send({ location: buildLocationSummary(location) });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving location." });
    }
};

exports.getLocationShareLink = async (req, res) => {
    try {
        const location = await Location.findByPk(req.params.locationId);

        if (!location) {
            return res.status(404).send({ message: "Location not found." });
        }

        res.send({
            location_id: location.location_id,
            share_url: buildShareUrl(location.location_id)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error generating location share link." });
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

exports.removeBookmarkById = async (req, res) => {
    try {
        const deleted = await LocationBookmark.destroy({
            where: { user_id: req.user_id, location_bookmark_id: req.params.bookmarkId }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Bookmark not found." });
        }

        res.send({ message: "Bookmark removed." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error removing bookmark." });
    }
};

exports.getRecentlyViewedLocations = async (req, res) => {
    try {
        const limit = parseLimit(req.query.limit);
        if (limit === null) {
            return res.status(400).send({ message: "limit must be a positive integer." });
        }

        const recentlyViewed = await RecentlyViewedLocation.findAll({
            where: { user_id: req.user_id },
            include: [{ model: Location, required: true }],
            order: [["viewed_at", "DESC"]],
            limit
        });

        res.send({
            recently_viewed: recentlyViewed.map(buildRecentlyViewedResponse)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving recently viewed locations." });
    }
};

exports.addRecentlyViewedLocation = async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const location = await Location.findByPk(locationId);

        if (!location) {
            return res.status(404).send({ message: "Location not found." });
        }

        const [recentView, created] = await RecentlyViewedLocation.findOrCreate({
            where: { user_id: req.user_id, location_id: locationId },
            defaults: {
                user_id: req.user_id,
                location_id: locationId,
                viewed_at: new Date()
            }
        });

        if (!created) {
            await recentView.update({ viewed_at: new Date() });
        }

        const savedRecentView = await RecentlyViewedLocation.findOne({
            where: { user_id: req.user_id, location_id: locationId },
            include: [{ model: Location, required: true }]
        });

        res.send({
            message: "Recently viewed location updated.",
            recently_viewed: buildRecentlyViewedResponse(savedRecentView)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error updating recently viewed locations." });
    }
};

exports.getLocationLists = async (req, res) => {
    try {
        const lists = await LocationList.findAll({
            where: { user_id: req.user_id },
            include: [
                {
                    model: LocationListItem,
                    as: "items",
                    required: false,
                    include: [{ model: Location, required: true }]
                }
            ],
            order: [["updated_at", "DESC"]]
        });

        res.send({ lists: lists.map(buildLocationListResponse) });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving custom lists." });
    }
};

exports.createLocationList = async (req, res) => {
    try {
        const listName = normalizeListName(req.body?.name);
        if (!listName) {
            return res.status(400).send({ message: "name is required and must be 1-100 characters." });
        }

        const existingList = await LocationList.findOne({
            where: {
                user_id: req.user_id,
                name: { [Op.iLike]: listName }
            }
        });

        if (existingList) {
            return res.status(400).send({ message: "A list with this name already exists." });
        }

        const createdList = await LocationList.create({
            user_id: req.user_id,
            name: listName
        });

        res.status(201).send({
            message: "Custom list created.",
            list: buildLocationListResponse(createdList)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating custom list." });
    }
};

exports.updateLocationList = async (req, res) => {
    try {
        const listName = normalizeListName(req.body?.name);
        if (!listName) {
            return res.status(400).send({ message: "name is required and must be 1-100 characters." });
        }

        const list = await LocationList.findOne({
            where: {
                list_id: req.params.listId,
                user_id: req.user_id
            }
        });

        if (!list) {
            return res.status(404).send({ message: "Custom list not found." });
        }

        const existingList = await LocationList.findOne({
            where: {
                list_id: { [Op.ne]: list.list_id },
                user_id: req.user_id,
                name: { [Op.iLike]: listName }
            }
        });

        if (existingList) {
            return res.status(400).send({ message: "A list with this name already exists." });
        }

        await list.update({
            name: listName,
            updated_at: new Date()
        });

        const updatedList = await LocationList.findOne({
            where: { list_id: list.list_id },
            include: [
                {
                    model: LocationListItem,
                    as: "items",
                    required: false,
                    include: [{ model: Location, required: true }]
                }
            ]
        });

        res.send({
            message: "Custom list updated.",
            list: buildLocationListResponse(updatedList)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error updating custom list." });
    }
};

exports.deleteLocationList = async (req, res) => {
    try {
        const deleted = await LocationList.destroy({
            where: {
                list_id: req.params.listId,
                user_id: req.user_id
            }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Custom list not found." });
        }

        res.send({ message: "Custom list deleted." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error deleting custom list." });
    }
};

exports.addLocationToList = async (req, res) => {
    try {
        const listId = req.params.listId;
        const locationId = req.body?.location_id;

        if (!locationId) {
            return res.status(400).send({ message: "location_id is required." });
        }

        const list = await LocationList.findOne({
            where: {
                list_id: listId,
                user_id: req.user_id
            }
        });

        if (!list) {
            return res.status(404).send({ message: "Custom list not found." });
        }

        const location = await Location.findByPk(locationId);
        if (!location) {
            return res.status(404).send({ message: "Location not found." });
        }

        const [listItem, created] = await LocationListItem.findOrCreate({
            where: { list_id: listId, location_id: locationId },
            defaults: {
                list_id: listId,
                location_id: locationId
            }
        });

        if (!created) {
            return res.status(200).send({ message: "Location is already in this list." });
        }

        await list.update({ updated_at: new Date() });

        const savedListItem = await LocationListItem.findByPk(listItem.list_item_id, {
            include: [{ model: Location, required: true }]
        });

        res.status(201).send({
            message: "Location added to list.",
            item: buildListItemResponse(savedListItem)
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error adding location to list." });
    }
};

exports.removeLocationFromList = async (req, res) => {
    try {
        const listId = req.params.listId;
        const locationId = req.params.locationId;

        const list = await LocationList.findOne({
            where: {
                list_id: listId,
                user_id: req.user_id
            }
        });

        if (!list) {
            return res.status(404).send({ message: "Custom list not found." });
        }

        const deleted = await LocationListItem.destroy({
            where: {
                list_id: listId,
                location_id: locationId
            }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Location is not in this list." });
        }

        await list.update({ updated_at: new Date() });

        res.send({ message: "Location removed from list." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error removing location from list." });
    }
};
