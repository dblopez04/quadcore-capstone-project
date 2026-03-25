const { Op } = require("sequelize");
const db = require("../models");
const { sendEventReminderEmail } = require("../services/notifications/emailService");

const EventReminder = db.EventReminder;
const Event = db.Event;
const EventBookmark = db.EventBookmark;
const Location = db.Location;
const User = db.User;

const REMINDER_POLL_INTERVAL_MS = Number(process.env.REMINDER_POLL_INTERVAL_MS || 60000);

let intervalId = null;
let isRunning = false;

const getDesiredEmailReminderTime = (event) => {
    return new Date(new Date(event.start_date_time).getTime() - (24 * 60 * 60 * 1000));
};

const shouldStartDispatcher = () => {
    return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
};

async function markReminderFailure(reminder, message) {
    await reminder.update({
        failed_at: new Date(),
        last_error: message
    });
}

async function processDueReminder(reminder) {
    const bookmark = await EventBookmark.findOne({
        where: {
            user_id: reminder.user_id,
            event_id: reminder.event_id
        }
    });

    if (!bookmark) {
        await reminder.destroy();
        return;
    }

    const event = reminder.Event;
    const desiredRemindAt = getDesiredEmailReminderTime(event);
    const now = new Date();

    if (reminder.remind_at.getTime() !== desiredRemindAt.getTime()) {
        await reminder.update({
            remind_at: desiredRemindAt,
            failed_at: null,
            last_error: null
        });

        if (desiredRemindAt > now) {
            return;
        }
    }

    if (event.status === "CANCELLED" || event.end_date_time <= now) {
        await markReminderFailure(reminder, "Event is no longer upcoming.");
        return;
    }

    if (!reminder.User || !reminder.User.email) {
        await markReminderFailure(reminder, "User is missing an email address.");
        return;
    }

    await sendEventReminderEmail({
        to: reminder.User.email,
        event
    });

    await reminder.update({
        sent_at: new Date(),
        failed_at: null,
        last_error: null
    });
}

async function runReminderDispatch() {
    if (isRunning) {
        return;
    }

    isRunning = true;

    try {
        const reminders = await EventReminder.findAll({
            where: {
                channel: "EMAIL",
                sent_at: null,
                remind_at: { [Op.lte]: new Date() }
            },
            include: [
                { model: User, required: true },
                {
                    model: Event,
                    required: true,
                    include: [{ model: Location }]
                }
            ],
            order: [["remind_at", "ASC"]]
        });

        for (const reminder of reminders) {
            try {
                await processDueReminder(reminder);
            } catch (error) {
                await markReminderFailure(reminder, error.message || "Error sending reminder.");
            }
        }
    } finally {
        isRunning = false;
    }
}

function startReminderDispatcher() {
    if (intervalId || !shouldStartDispatcher()) {
        return;
    }

    intervalId = setInterval(() => {
        runReminderDispatch().catch((error) => {
            console.error("Reminder dispatch failed:", error);
        });
    }, REMINDER_POLL_INTERVAL_MS);

    runReminderDispatch().catch((error) => {
        console.error("Reminder dispatch failed:", error);
    });
}

module.exports = {
    runReminderDispatch,
    startReminderDispatcher
};
