const db = require("../models");
const { Op } = require("sequelize");

const Event = db.Event;
const EventBookmark = db.EventBookmark;
const Location = db.Location;

exports.getBookmarkedEvents = async (req, res) => {
    try {
        const { start, end, status, event_type } = req.query;
        const where = {};

        if (status) where.status = status;
        if (event_type) where.event_type = event_type;

        if (start || end) {
            const startDate = start ? new Date(start) : null;
            const endDate = end ? new Date(end) : null;

            if ((start && isNaN(startDate)) || (end && isNaN(endDate))) {
                return res.status(400).send({ message: "Invalid start or end date" });
            }

            if (startDate && endDate) {
                where[Op.and] = [
                    { start_date_time: { [Op.lte]: endDate } },
                    { end_date_time: { [Op.gte]: startDate } }
                ];
            } else if (startDate) {
                where.end_date_time = { [Op.gte]: startDate };
            } else if (endDate) {
                where.start_date_time = { [Op.lte]: endDate };
            }
        }

        const bookmarks = await EventBookmark.findAll({
            where: { user_id: req.user_id },
            include: [
                {
                    model: Event,
                    required: true,
                    where,
                    include: [{ model: Location }]
                }
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]]
        });

        const events = bookmarks.map((bookmark) => {
            const event = bookmark.Event;
            const location = event && event.Location ? {
                location_id: event.Location.location_id,
                name: event.Location.name,
                description: event.Location.description,
                coordinates: event.Location.coordinates
            } : null;

            return {
                event_id: event.event_id,
                title: event.title,
                description: event.description,
                start_date_time: event.start_date_time,
                end_date_time: event.end_date_time,
                event_type: event.event_type,
                status: event.status,
                is_public: event.is_public,
                location
            };
        });

        res.send({ events });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving bookmarked events." });
    }
};

exports.bookmarkEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findByPk(eventId);

        if (!event) {
            return res.status(404).send({ message: "Event not found." });
        }

        const [bookmark, created] = await EventBookmark.findOrCreate({
            where: { user_id: req.user_id, event_id: eventId },
            defaults: { user_id: req.user_id, event_id: eventId }
        });

        if (!created) {
            return res.status(200).send({ message: "Event already bookmarked." });
        }

        res.status(201).send({
            message: "Event bookmarked.",
            event_bookmark_id: bookmark.event_bookmark_id
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error bookmarking event." });
    }
};

exports.removeBookmark = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const deleted = await EventBookmark.destroy({
            where: { user_id: req.user_id, event_id: eventId }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Bookmark not found." });
        }

        res.send({ message: "Bookmark removed." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error removing bookmark." });
    }
};
