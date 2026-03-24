const db = require("../models");
const { Op } = require("sequelize");

const Event = db.Event;
const EventBookmark = db.EventBookmark;
const EventDetail = db.EventDetail;
const EventRegistration = db.EventRegistration;
const EventTag = db.EventTag;
const EventTagAssignment = db.EventTagAssignment;
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
                    { end_date_time: { [Op.gte]: startDate } }
                ]
            }
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

const buildEventResponse = (event, sources) => {
    const location = event && event.Location ? {
        location_id: event.Location.location_id,
        name: event.Location.name,
        description: event.Location.description,
        coordinates: event.Location.coordinates
    } : null;

    const tags = event && event.EventTags
        ? event.EventTags.map((tag) => ({
            event_tag_id: tag.event_tag_id,
            name: tag.name
        }))
        : [];

    const details = event && event.details
        ? {
            event_detail_id: event.details.event_detail_id,
            source_url: event.details.source_url,
            source_location_name: event.details.source_location_name,
            source_location_url: event.details.source_location_url,
            room_detail: event.details.room_detail,
            address: event.details.address,
            image_url: event.details.image_url,
            website_url: event.details.website_url,
            metadata: event.details.metadata || {}
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
        is_public: event.is_public,
        location,
        details,
        tags
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

const buildEventInclude = (tagNames) => {
    const include = [
        { model: Location },
        { model: EventDetail, as: "details", required: false },
        {
            model: EventTag,
            through: { attributes: [] },
            required: tagNames.length > 0,
            where: tagNames.length > 0 ? { name: { [Op.in]: tagNames } } : undefined
        }
    ];

    return include;
};

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

exports.getEvents = async (req, res) => {
    try {
        const { q, start, end, status, event_type, location_id } = req.query;
        const tagNames = parseList(req.query.tags || req.query.tag);
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
                { "$details.address$": { [Op.iLike]: `%${q}%` } }
            ];
        }

        const range = buildDateRange(start, end);
        if (range.error) {
            return res.status(400).send({ message: range.error });
        }

        Object.assign(where, range.where);

        const events = await Event.findAll({
            where,
            include: buildEventInclude(tagNames),
            order: [["start_date_time", "ASC"]],
            distinct: true
        });

        res.send({ events: events.map((event) => buildEventResponse(event)) });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving events." });
    }
};

exports.getBookmarkedEvents = async (req, res) => {
    try {
        const { start, end, status, event_type } = req.query;
        const tagNames = parseList(req.query.tags || req.query.tag);
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
                    include: buildEventInclude(tagNames)
                }
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]],
            distinct: true
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
                    include: [{ model: Location }]
                }
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]]
        });

        const lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//QuadCore//EN",
            "CALSCALE:GREGORIAN"
        ];

        const stamp = formatIcsDate(new Date());

        bookmarks.forEach((bookmark) => {
            const event = getIncludedEvent(bookmark);
            if (!event) return;
            const locationName = event.Location ? event.Location.name : "";

            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${event.event_id}`);
            lines.push(`DTSTAMP:${stamp}`);
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

exports.registerForEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const transaction = await db.sequelize.transaction();

    try {
        const event = await Event.findByPk(eventId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!event) {
            await transaction.rollback();
            return res.status(404).send({ message: "Event not found." });
        }

        if (event.capacity && event.registered_count >= event.capacity) {
            await transaction.rollback();
            return res.status(409).send({ message: "Event is at full capacity." });
        }

        const [registration, created] = await EventRegistration.findOrCreate({
            where: { user_id: req.user_id, event_id: eventId },
            defaults: { user_id: req.user_id, event_id: eventId },
            transaction
        });

        if (!created) {
            await transaction.commit();
            return res.status(200).send({ message: "Already registered." });
        }

        await event.increment("registered_count", { by: 1, transaction });
        await transaction.commit();

        return res.status(201).send({
            message: "Registered for event.",
            registration_id: registration.registration_id
        });
    } catch (err) {
        await transaction.rollback();
        return res.status(500).send({ message: err.message || "Error registering for event." });
    }
};

exports.unregisterFromEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const transaction = await db.sequelize.transaction();

    try {
        const event = await Event.findByPk(eventId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!event) {
            await transaction.rollback();
            return res.status(404).send({ message: "Event not found." });
        }

        const deleted = await EventRegistration.destroy({
            where: { user_id: req.user_id, event_id: eventId },
            transaction
        });

        if (deleted === 0) {
            await transaction.rollback();
            return res.status(404).send({ message: "Registration not found." });
        }

        if (event.registered_count > 0) {
            await event.decrement("registered_count", { by: 1, transaction });
        }

        await transaction.commit();
        return res.send({ message: "Registration removed." });
    } catch (err) {
        await transaction.rollback();
        return res.status(500).send({ message: err.message || "Error removing registration." });
    }
};

exports.getRegistrations = async (req, res) => {
    try {
        const { start, end, status, event_type } = req.query;
        const tagNames = parseList(req.query.tags || req.query.tag);
        const where = {};

        if (status) where.status = status;
        if (event_type) where.event_type = event_type;

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
                    include: buildEventInclude(tagNames)
                }
            ],
            order: [[{ model: Event }, "start_date_time", "ASC"]],
            distinct: true
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
                        include: buildEventInclude([])
                    }
                ]
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
                        sources: new Set(["BOOKMARK"])
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
                        include: buildEventInclude([])
                    }
                ]
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
                        sources: new Set(["REGISTRATION"])
                    });
                }
            });
        }

        const events = Array.from(eventMap.values())
            .map((item) => ({
                event: item.event,
                sources: Array.from(item.sources)
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
                const nextEnd = new Date(next.event.end_date_time);

                if (nextStart > currentEnd) {
                    break;
                }

                const overlaps = currentStart <= nextEnd && currentEnd >= nextStart;
                if (overlaps) {
                    conflicts.push({
                        event_a: buildEventResponse(current.event, current.sources),
                        event_b: buildEventResponse(next.event, next.sources)
                    });
                }
            }
        }

        res.send({ conflicts });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error detecting conflicts." });
    }
};

exports.listTags = async (req, res) => {
    try {
        const tags = await EventTag.findAll({ order: [["name", "ASC"]] });
        res.send({
            tags: tags.map((tag) => ({ event_tag_id: tag.event_tag_id, name: tag.name }))
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving tags." });
    }
};

exports.createTag = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        if (!name) {
            return res.status(400).send({ message: "Tag name is required." });
        }

        const [tag, created] = await EventTag.findOrCreate({
            where: { name },
            defaults: { name }
        });

        if (!created) {
            return res.status(409).send({ message: "Tag already exists." });
        }

        res.status(201).send({ event_tag_id: tag.event_tag_id, name: tag.name });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating tag." });
    }
};

exports.addTagsToEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const tags = parseList(req.body.tags);

        if (tags.length === 0) {
            return res.status(400).send({ message: "Tags array is required." });
        }

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).send({ message: "Event not found." });
        }

        const createdTags = [];

        for (const tagName of tags) {
            const [tag] = await EventTag.findOrCreate({
                where: { name: tagName },
                defaults: { name: tagName }
            });

            await EventTagAssignment.findOrCreate({
                where: { event_id: eventId, event_tag_id: tag.event_tag_id },
                defaults: { event_id: eventId, event_tag_id: tag.event_tag_id }
            });

            createdTags.push({ event_tag_id: tag.event_tag_id, name: tag.name });
        }

        res.status(201).send({ tags: createdTags });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error assigning tags." });
    }
};

exports.removeTagFromEvent = async (req, res) => {
    try {
        const { eventId, tagId } = req.params;

        const deleted = await EventTagAssignment.destroy({
            where: { event_id: eventId, event_tag_id: tagId }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Tag assignment not found." });
        }

        res.send({ message: "Tag removed." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error removing tag." });
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
                    include: buildEventInclude([])
                }
            ],
            order: [["remind_at", "ASC"]]
        });

        const response = reminders
            .map((reminder) => {
                const event = getIncludedEvent(reminder);
                if (!event) return null;

                return {
                    event_reminder_id: reminder.event_reminder_id,
                    remind_at: reminder.remind_at,
                    channel: reminder.channel,
                    event: buildEventResponse(event)
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
            channel
        });

        res.status(201).send({
            event_reminder_id: reminder.event_reminder_id,
            remind_at: reminder.remind_at,
            channel: reminder.channel
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating reminder." });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        const reminderId = req.params.reminderId;

        const deleted = await EventReminder.destroy({
            where: { event_reminder_id: reminderId, user_id: req.user_id }
        });

        if (deleted === 0) {
            return res.status(404).send({ message: "Reminder not found." });
        }

        res.send({ message: "Reminder deleted." });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error deleting reminder." });
    }
};
