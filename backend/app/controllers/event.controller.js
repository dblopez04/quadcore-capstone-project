const db = require("../models");
const { Op } = require("sequelize");

const Event = db.Event;
const EventBookmark = db.EventBookmark;
const EventCategorySubscription = db.EventCategorySubscription;
const EventDetail = db.EventDetail;
const EventRegistration = db.EventRegistration;
const EventReminder = db.EventReminder;
const Location = db.Location;

const parseList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const normalizeEventType = (value) => String(value || "").trim();

const buildDateRange = (start, end) => {
    if (!start && !end) return { where: {} };

    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    if ((start && isNaN(startDate)) || (end && isNaN(endDate))) {
        return { error: "Invalid start or end date" };
    }

    if (startDate && endDate) {
        return {
            where: {
                [Op.and]: [
                    { start_date_time: { [Op.lte]: endDate } },
                    { end_date_time: { [Op.gte]: startDate } },
                ],
            },
        };
    }

    if (startDate) {
        return { where: { end_date_time: { [Op.gte]: startDate } } };
    }

    return { where: { start_date_time: { [Op.lte]: endDate } } };
};

const buildTimestampRange = (field, start, end) => {
    if (!start && !end) return { where: {} };

    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    if ((start && isNaN(startDate)) || (end && isNaN(endDate))) {
        return { error: "Invalid start or end date" };
    }

    if (startDate && endDate) {
        return { where: { [field]: { [Op.between]: [startDate, endDate] } } };
    }

    if (startDate) {
        return { where: { [field]: { [Op.gte]: startDate } } };
    }

    return { where: { [field]: { [Op.lte]: endDate } } };
};

const buildEventInclude = () => ([
    { model: Location },
    { model: EventDetail, as: "details", required: false },
]);

const buildEventResponse = (event, sources) => {
    const rawLocation = event?.location || event?.Location || null;
    const location = rawLocation
        ? {
            location_id: rawLocation.location_id,
            name: rawLocation.name,
            description: rawLocation.description,
            coordinates: rawLocation.coordinates,
        }
        : null;

    const details = event?.details
        ? {
            event_id: event.details.event_id,
            source_url: event.details.source_url,
            source_location_name: event.details.source_location_name,
            room_detail: event.details.room_detail,
            metadata: event.details.metadata || {},
        }
        : null;

    const response = {
        event_id: event.event_id,
        title: event.title,
        description: event.description,
        start_date_time: event.start_date_time,
        end_date_time: event.end_date_time,
        event_type: event.event_type,
        status: event.status,
        location_id: location?.location_id || event.location_id || null,
        location,
        details,
    };

    if (sources && sources.length) {
        response.sources = sources;
    }

    return response;
};

const getIncludedEvent = (record) => (
    record?.Event
    || record?.event
    || record?.dataValues?.Event
    || record?.dataValues?.event
    || null
);

const escapeIcsText = (value) => {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
};

const formatIcsDate = (value) => {
    if (!value) return "";
    return new Date(value)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
};

const loadEvents = async (where) => {
    return Event.findAll({
        where,
        include: buildEventInclude(),
        order: [["start_date_time", "ASC"]],
    });
};

exports.getEvents = async (req, res) => {
    try {
        const { q, start, end, status, event_type, location_id } = req.query;
        const where = {};

        if (status) where.status = status;
        if (location_id) where.location_id = location_id;

        const eventTypes = parseList(event_type);
        if (eventTypes.length === 1) {
            where.event_type = eventTypes[0];
        } else if (eventTypes.length > 1) {
            where.event_type = { [Op.in]: eventTypes };
        }

        if (q) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${q}%` } },
                { description: { [Op.iLike]: `%${q}%` } },
                { "$Location.name$": { [Op.iLike]: `%${q}%` } },
                { "$details.source_location_name$": { [Op.iLike]: `%${q}%` } },
                { "$details.room_detail$": { [Op.iLike]: `%${q}%` } },
            ];
        }

        const range = buildDateRange(start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        Object.assign(where, range.where);
        const events = await loadEvents(where);
        res.send({ events: events.map((event) => buildEventResponse(event)) });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving events." });
    }
};

exports.getBookmarkedEvents = async (req, res) => {
    try {
        const { start, end, status, event_type } = req.query;
        const where = {};

        if (status) where.status = status;
        if (event_type) where.event_type = event_type;

        const range = buildDateRange(start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        Object.assign(where, range.where);

        const bookmarks = await EventBookmark.findAll({
            where: { user_id: req.user_id },
            include: [
                {
                    model: Event,
                    required: true,
                    where,
                    include: buildEventInclude(),
                },
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]],
        });

        const events = bookmarks
            .map((bookmark) => getIncludedEvent(bookmark))
            .filter(Boolean)
            .map((event) => buildEventResponse(event));

        res.send({ events });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving bookmarked events." });
    }
};

exports.getRegistrations = async (req, res) => {
    try {
        const { start, end, status, event_type } = req.query;
        const where = {};

        if (status) where.status = status;

        const eventTypes = parseList(event_type);
        if (eventTypes.length === 1) {
            where.event_type = eventTypes[0];
        } else if (eventTypes.length > 1) {
            where.event_type = { [Op.in]: eventTypes };
        }

        const range = buildDateRange(start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        Object.assign(where, range.where);

        const registrations = await EventRegistration.findAll({
            where: { user_id: req.user_id },
            include: [
                {
                    model: Event,
                    required: true,
                    where,
                    include: buildEventInclude(),
                },
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]],
        });

        const events = registrations
            .map((registration) => getIncludedEvent(registration))
            .filter(Boolean)
            .map((event) => buildEventResponse(event));

        res.send({ events });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving registrations." });
    }
};

exports.getCategorySubscriptions = async (req, res) => {
    try {
        const subscriptions = await EventCategorySubscription.findAll({
            where: { user_id: req.user_id },
            order: [["event_type", "ASC"]],
        });

        res.send({
            subscriptions: subscriptions.map((subscription) => ({
                subscription_id: subscription.subscription_id,
                event_type: subscription.event_type,
                last_digest_sent_at: subscription.last_digest_sent_at,
                created_at: subscription.created_at,
            })),
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving category subscriptions." });
    }
};

exports.createCategorySubscription = async (req, res) => {
    try {
        const eventType = normalizeEventType(req.body.event_type || req.body.category);

        if (!eventType) {
            return res.status(400).send({ message: "event_type is required." });
        }

        if (eventType.length > 255) {
            return res.status(400).send({ message: "event_type must be 255 characters or fewer." });
        }

        const [subscription, created] = await EventCategorySubscription.findOrCreate({
            where: { user_id: req.user_id, event_type: eventType },
            defaults: { user_id: req.user_id, event_type: eventType },
        });

        return res.status(created ? 201 : 200).send({
            message: created ? "Category subscription created." : "Already subscribed to this category.",
            subscription: {
                subscription_id: subscription.subscription_id,
                event_type: subscription.event_type,
                last_digest_sent_at: subscription.last_digest_sent_at,
                created_at: subscription.created_at,
            },
        });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error creating category subscription." });
    }
};

exports.deleteCategorySubscription = async (req, res) => {
    try {
        const deleted = await EventCategorySubscription.destroy({
            where: {
                subscription_id: req.params.subscriptionId,
                user_id: req.user_id,
            },
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Category subscription not found." });
        }

        return res.send({ message: "Category subscription removed." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error removing category subscription." });
    }
};

exports.exportBookmarkedEventsIcs = async (req, res) => {
    try {
        const { start, end } = req.query;
        const range = buildDateRange(start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        const bookmarks = await EventBookmark.findAll({
            where: { user_id: req.user_id },
            include: [
                {
                    model: Event,
                    required: true,
                    where: range.where,
                    include: [{ model: Location }],
                },
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]],
        });

        const lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//quadcore//Bookmarked Events//EN",
        ];

        bookmarks.forEach((bookmark) => {
            const event = getIncludedEvent(bookmark);
            if (!event) return;
            const locationName = event.Location ? event.Location.name : "";

            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${event.event_id}`);
            lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
            lines.push(`DTSTART:${formatIcsDate(event.start_date_time)}`);
            lines.push(`DTEND:${formatIcsDate(event.end_date_time)}`);
            lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
            if (event.description) {
                lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
            }
            if (locationName) {
                lines.push(`LOCATION:${escapeIcsText(locationName)}`);
            }
            lines.push("END:VEVENT");
        });

        lines.push("END:VCALENDAR");

        res.set("Content-Type", "text/calendar");
        res.set("Content-Disposition", "attachment; filename=bookmarked-events.ics");
        res.status(200).send(lines.join("\r\n"));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error exporting calendar." });
    }
};

exports.registerForEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findByPk(eventId);

        if (!event) {
            return res.status(404).send({ message: "Event not found." });
        }

        const [registration, created] = await EventRegistration.findOrCreate({
            where: { user_id: req.user_id, event_id: eventId },
            defaults: { user_id: req.user_id, event_id: eventId },
        });

        if (!created) {
            return res.status(200).send({ message: "Already registered." });
        }

        return res.status(201).send({
            message: "Registered for event.",
            registration_id: registration.registration_id,
        });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error registering for event." });
    }
};

exports.unregisterFromEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const deleted = await EventRegistration.destroy({
            where: { user_id: req.user_id, event_id: eventId },
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Registration not found." });
        }

        return res.send({ message: "Registration removed." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error removing registration." });
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
            defaults: { user_id: req.user_id, event_id: eventId },
        });

        if (!created) {
            return res.status(200).send({ message: "Event already bookmarked." });
        }

        res.status(201).send({
            message: "Event bookmarked.",
            user_id: bookmark.user_id,
            event_id: bookmark.event_id,
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error bookmarking event." });
    }
};

exports.removeBookmark = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const num = await EventBookmark.destroy({
            where: { user_id: req.user_id, event_id: eventId },
        });

        if (num !== 1) {
            return res.status(404).send({ message: "Bookmark not found." });
        }

        res.send({ message: "Bookmark removed." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error removing bookmark." });
    }
};

exports.getConflicts = async (req, res) => {
    try {
        const { start, end, source } = req.query;
        const sources = parseList(source);
        const includeBookmarks = sources.length === 0 || sources.includes("bookmarks");
        const includeRegistrations = sources.length === 0 || sources.includes("registrations");

        const range = buildDateRange(start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        const eventMap = new Map();

        if (includeBookmarks) {
            const bookmarks = await EventBookmark.findAll({
                where: { user_id: req.user_id },
                include: [
                    {
                        model: Event,
                        required: true,
                        where: range.where,
                        include: buildEventInclude(),
                    },
                ],
            });

            bookmarks.forEach((bookmark) => {
                const event = getIncludedEvent(bookmark);
                if (!event) return;

                const existing = eventMap.get(event.event_id);
                if (existing) {
                    existing.sources.add("BOOKMARK");
                } else {
                    eventMap.set(event.event_id, {
                        event,
                        sources: new Set(["BOOKMARK"]),
                    });
                }
            });
        }

        if (includeRegistrations) {
            const registrations = await EventRegistration.findAll({
                where: { user_id: req.user_id },
                include: [
                    {
                        model: Event,
                        required: true,
                        where: range.where,
                        include: buildEventInclude(),
                    },
                ],
            });

            registrations.forEach((registration) => {
                const event = getIncludedEvent(registration);
                if (!event) return;

                const existing = eventMap.get(event.event_id);
                if (existing) {
                    existing.sources.add("REGISTRATION");
                } else {
                    eventMap.set(event.event_id, {
                        event,
                        sources: new Set(["REGISTRATION"]),
                    });
                }
            });
        }

        const events = Array.from(eventMap.values())
            .map((item) => ({
                event: item.event,
                sources: Array.from(item.sources),
            }))
            .sort((a, b) => new Date(a.event.start_date_time) - new Date(b.event.start_date_time));

        const conflicts = [];
        for (let i = 0; i < events.length; i += 1) {
            const current = events[i];
            const currentStart = new Date(current.event.start_date_time);
            const currentEnd = new Date(current.event.end_date_time);

            for (let j = i + 1; j < events.length; j += 1) {
                const next = events[j];
                const nextStart = new Date(next.event.start_date_time);
                if (nextStart > currentEnd) break;
                const nextEnd = new Date(next.event.end_date_time);

                if (currentStart <= nextEnd && currentEnd >= nextStart) {
                    conflicts.push({
                        event_a: buildEventResponse(current.event, current.sources),
                        event_b: buildEventResponse(next.event, next.sources),
                    });
                }
            }
        }

        res.send({ conflicts });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error detecting conflicts." });
    }
};

exports.getReminders = async (req, res) => {
    try {
        const { start, end } = req.query;
        const where = { user_id: req.user_id };

        const range = buildTimestampRange("remind_at", start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        Object.assign(where, range.where);

        const reminders = await EventReminder.findAll({
            where,
            include: [
                {
                    model: Event,
                    required: true,
                    include: buildEventInclude(),
                },
            ],
            order: [["remind_at", "ASC"]],
        });

        const response = reminders
            .map((reminder) => {
                const event = getIncludedEvent(reminder);
                if (!event) return null;

                return {
                    event_reminder_id: reminder.event_reminder_id,
                    remind_at: reminder.remind_at,
                    channel: reminder.channel,
                    event: buildEventResponse(event),
                };
            })
            .filter(Boolean);

        res.send({ reminders: response });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving reminders." });
    }
};

exports.createReminder = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const remindAt = req.body.remind_at;
        const channel = req.body.channel || "IN_APP";

        if (!remindAt) {
            return res.status(400).send({ message: "remind_at is required." });
        }

        const remindDate = new Date(remindAt);
        if (isNaN(remindDate)) {
            return res.status(400).send({ message: "Invalid remind_at value." });
        }

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).send({ message: "Event not found." });
        }

        const reminder = await EventReminder.create({
            user_id: req.user_id,
            event_id: eventId,
            remind_at: remindDate,
            channel,
        });

        res.status(201).send({
            event_reminder_id: reminder.event_reminder_id,
            remind_at: reminder.remind_at,
            channel: reminder.channel,
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating reminder." });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        const reminderId = req.params.reminderId;

        const deleted = await EventReminder.destroy({
            where: { event_reminder_id: reminderId, user_id: req.user_id },
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Reminder not found." });
        }

        res.send({ message: "Reminder deleted." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error deleting reminder." });
    }
};
