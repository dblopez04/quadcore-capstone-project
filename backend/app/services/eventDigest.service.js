const { Op } = require("sequelize");
const db = require("../models");
const { sendWeeklyEventDigestEmail } = require("./email.service");

const DEFAULT_DIGEST_WINDOW_DAYS = 7;
const DEFAULT_MIN_SEND_INTERVAL_DAYS = 6;

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function getWindowDays(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_DIGEST_WINDOW_DAYS;
    }

    return parsed;
}

async function loadUpcomingEvents(eventType, windowStart, windowEnd) {
    return db.Event.findAll({
        where: {
            event_type: eventType,
            status: { [Op.in]: ["SCHEDULED", "ONGOING"] },
            [Op.and]: [
                { start_date_time: { [Op.lt]: windowEnd } },
                { end_date_time: { [Op.gte]: windowStart } },
            ],
        },
        include: [
            { model: db.Location },
            { model: db.EventDetail, as: "details", required: false },
        ],
        order: [["start_date_time", "ASC"]],
    });
}

async function sendWeeklyCategoryDigests(options = {}) {
    const now = options.now ? new Date(options.now) : new Date();
    const windowDays = getWindowDays(options.windowDays || process.env.WEEKLY_DIGEST_WINDOW_DAYS);
    const windowStart = options.windowStart ? new Date(options.windowStart) : now;
    const windowEnd = options.windowEnd ? new Date(options.windowEnd) : addDays(windowStart, windowDays);
    const frontendUrl = options.frontendUrl || process.env.FRONTEND_URL || "http://localhost:5173";
    const dryRun = Boolean(options.dryRun);
    const minSendIntervalDays = getWindowDays(options.minSendIntervalDays || DEFAULT_MIN_SEND_INTERVAL_DAYS);
    const lastAllowedSendAt = addDays(now, -minSendIntervalDays);

    const subscriptions = await db.EventCategorySubscription.findAll({
        include: [
            {
                model: db.User,
                required: true,
                attributes: ["user_id", "email"],
            },
        ],
        order: [["event_type", "ASC"], ["created_at", "ASC"]],
    });

    const summary = {
        dryRun,
        checked: subscriptions.length,
        sent: 0,
        would_send: 0,
        skipped: 0,
        failed: 0,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        results: [],
    };

    for (const subscription of subscriptions) {
        const user = subscription.User || subscription.user;
        const result = {
            subscription_id: subscription.subscription_id,
            user_id: subscription.user_id,
            event_type: subscription.event_type,
            event_count: 0,
            status: "skipped",
        };

        try {
            if (!user?.email) {
                result.reason = "missing email";
                summary.skipped += 1;
                summary.results.push(result);
                continue;
            }

            if (!dryRun && subscription.last_digest_sent_at) {
                const lastSentAt = new Date(subscription.last_digest_sent_at);
                if (!Number.isNaN(lastSentAt.getTime()) && lastSentAt > lastAllowedSendAt) {
                    result.reason = "recently sent";
                    summary.skipped += 1;
                    summary.results.push(result);
                    continue;
                }
            }

            const events = await loadUpcomingEvents(subscription.event_type, windowStart, windowEnd);
            result.event_count = events.length;

            if (events.length === 0) {
                result.reason = "no upcoming events";
                summary.skipped += 1;
                summary.results.push(result);
                continue;
            }

            if (!dryRun) {
                await sendWeeklyEventDigestEmail({
                    to: user.email,
                    eventType: subscription.event_type,
                    events,
                    frontendUrl,
                });

                await subscription.update({ last_digest_sent_at: now });
            }

            result.status = dryRun ? "would_send" : "sent";
            if (dryRun) {
                summary.would_send += 1;
            } else {
                summary.sent += 1;
            }
            summary.results.push(result);
        } catch (err) {
            result.status = "failed";
            result.reason = err.message || "Unknown digest error";
            summary.failed += 1;
            summary.results.push(result);
        }
    }

    return summary;
}

module.exports = {
    sendWeeklyCategoryDigests,
    loadUpcomingEvents,
};
