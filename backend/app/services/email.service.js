const RESET_EMAIL_SUBJECT = "Reset your Mean Green Guide password";
const DEFAULT_BRAND_COLOR = "#006A31";
const CAMPUS_TIME_ZONE = "America/Chicago";

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatEventDateTime(value) {
    if (!value) return "TBD";

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: CAMPUS_TIME_ZONE,
    }).format(new Date(value));
}

function buildLocationLabel(event) {
    const locationName = event?.locationName || event?.location?.name || "";
    const roomDetail = event?.roomDetail || "";

    if (locationName && roomDetail) {
        return `${locationName} (${roomDetail})`;
    }

    return locationName || roomDetail || "Location details unavailable";
}

function formatDigestDate(value) {
    if (!value) return "Date not provided";

    return new Date(value).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: CAMPUS_TIME_ZONE,
    });
}

function formatDigestLocation(event) {
    const location = event?.Location || event?.location;
    const details = event?.details;
    const locationName = location?.name || details?.source_location_name || "";
    const roomDetail = details?.room_detail || "";

    if (locationName && roomDetail && !locationName.toLowerCase().includes(String(roomDetail).toLowerCase())) {
        return `${locationName}, ${roomDetail}`;
    }

    return locationName || roomDetail || "Location not provided";
}

function buildResetPasswordEmail(resetUrl, ttlMinutes) {
    const safeUrl = String(resetUrl || "");
    const safeTtlMinutes = Number.isFinite(Number(ttlMinutes))
        ? Number(ttlMinutes)
        : 15;

    return {
        subject: RESET_EMAIL_SUBJECT,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a;">
                <h2 style="margin-bottom: 8px;">Reset your password</h2>
                <p style="margin-top: 0;">We received a request to reset your Mean Green Guide password.</p>
                <p>
                    <a
                        href="${safeUrl}"
                        style="display: inline-block; padding: 12px 18px; border-radius: 6px; background: ${DEFAULT_BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600;"
                    >
                        Reset Password
                    </a>
                </p>
                <p>This link expires in ${safeTtlMinutes} minutes.</p>
                <p>If you did not request this email, you can safely ignore it.</p>
            </div>
        `,
        text: [
            "Reset your Mean Green Guide password",
            "",
            `Open this link to reset your password: ${safeUrl}`,
            "",
            `This link expires in ${safeTtlMinutes} minutes.`,
            "If you did not request this email, you can safely ignore it.",
        ].join("\n"),
    };
}

function buildEventRegistrationEmail({ user, event, eventsUrl }) {
    const safeTitle = escapeHtml(event?.title || "your event");
    const safeFirstName = escapeHtml(user?.firstName || "");
    const safeDescription = escapeHtml(event?.description || "");
    const safeLocation = escapeHtml(buildLocationLabel(event));
    const whenLabel = formatEventDateTime(event?.startDateTime);
    const endLabel = formatEventDateTime(event?.endDateTime);
    const greeting = safeFirstName ? `Hi ${safeFirstName},` : "Hello,";
    const reminderNote = "Reminder settings are managed separately from registration.";
    const hasEventsUrl = Boolean(eventsUrl);

    return {
        subject: `Registration confirmed: ${event?.title || "Event"}`,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a;">
                <h2 style="margin-bottom: 8px;">You're registered for ${safeTitle}</h2>
                <p style="margin-top: 0;">${greeting} your event registration is confirmed.</p>
                <p><strong>When:</strong> ${escapeHtml(whenLabel)}</p>
                <p><strong>Ends:</strong> ${escapeHtml(endLabel)}</p>
                <p><strong>Where:</strong> ${safeLocation}</p>
                ${safeDescription ? `<p>${safeDescription}</p>` : ""}
                <p>${escapeHtml(reminderNote)}</p>
                ${hasEventsUrl ? `
                    <p>
                        <a
                            href="${escapeHtml(eventsUrl)}"
                            style="display: inline-block; padding: 12px 18px; border-radius: 6px; background: ${DEFAULT_BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600;"
                        >
                            View Upcoming Events
                        </a>
                    </p>
                ` : ""}
            </div>
        `,
        text: [
            `You're registered for ${event?.title || "your event"}`,
            "",
            `${safeFirstName ? `Hi ${user.firstName}, ` : ""}your event registration is confirmed.`,
            `When: ${whenLabel}`,
            `Ends: ${endLabel}`,
            `Where: ${buildLocationLabel(event)}`,
            event?.description ? `Description: ${event.description}` : null,
            reminderNote,
            hasEventsUrl ? `View upcoming events: ${eventsUrl}` : null,
        ].filter(Boolean).join("\n"),
    };
}

function buildEventSavedEmail({ user, event, eventsUrl }) {
    const safeTitle = escapeHtml(event?.title || "your event");
    const safeFirstName = escapeHtml(user?.firstName || "");
    const safeDescription = escapeHtml(event?.description || "");
    const safeLocation = escapeHtml(buildLocationLabel(event));
    const whenLabel = formatEventDateTime(event?.startDateTime);
    const endLabel = formatEventDateTime(event?.endDateTime);
    const greeting = safeFirstName ? `Hi ${safeFirstName},` : "Hello,";
    const reminderNote = "If you want a 24-hour reminder, enable Email Reminder from your saved events.";
    const hasEventsUrl = Boolean(eventsUrl);

    return {
        subject: `Event saved: ${event?.title || "Event"}`,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a;">
                <h2 style="margin-bottom: 8px;">You saved ${safeTitle}</h2>
                <p style="margin-top: 0;">${greeting} this event has been added to your saved events.</p>
                <p><strong>When:</strong> ${escapeHtml(whenLabel)}</p>
                <p><strong>Ends:</strong> ${escapeHtml(endLabel)}</p>
                <p><strong>Where:</strong> ${safeLocation}</p>
                ${safeDescription ? `<p>${safeDescription}</p>` : ""}
                <p>${escapeHtml(reminderNote)}</p>
                ${hasEventsUrl ? `
                    <p>
                        <a
                            href="${escapeHtml(eventsUrl)}"
                            style="display: inline-block; padding: 12px 18px; border-radius: 6px; background: ${DEFAULT_BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600;"
                        >
                            View Saved Events
                        </a>
                    </p>
                ` : ""}
            </div>
        `,
        text: [
            `You saved ${event?.title || "your event"}`,
            "",
            `${safeFirstName ? `Hi ${user.firstName}, ` : ""}this event has been added to your saved events.`,
            `When: ${whenLabel}`,
            `Ends: ${endLabel}`,
            `Where: ${buildLocationLabel(event)}`,
            event?.description ? `Description: ${event.description}` : null,
            reminderNote,
            hasEventsUrl ? `View saved events: ${eventsUrl}` : null,
        ].filter(Boolean).join("\n"),
    };
}

function buildWeeklyEventDigestEmail({ eventType, events, frontendUrl }) {
    const safeEventType = String(eventType || "Campus").trim() || "Campus";
    const safeFrontendUrl = String(frontendUrl || "").trim().replace(/\/$/, "");
    const eventsUrl = safeFrontendUrl ? `${safeFrontendUrl}/events` : "";
    const eventRows = (Array.isArray(events) ? events : []).map((event) => {
        const title = escapeHtml(event.title || "Untitled event");
        const when = escapeHtml(formatDigestDate(event.start_date_time));
        const location = escapeHtml(formatDigestLocation(event));
        const description = escapeHtml(event.description || "");

        return `
            <li style="margin-bottom: 18px;">
                <div style="font-weight: 700; color: #1a1a1a;">${title}</div>
                <div style="color: #444444;">${when}</div>
                <div style="color: #444444;">${location}</div>
                ${description ? `<div style="margin-top: 6px; color: #555555;">${description}</div>` : ""}
            </li>
        `;
    });

    const listHtml = eventRows.length
        ? `<ul style="padding-left: 20px; margin-top: 16px;">${eventRows.join("")}</ul>`
        : "<p>No upcoming events are currently listed for this category.</p>";

    const textLines = [
        `Mean Green Guide weekly ${safeEventType} digest`,
        "",
        eventRows.length
            ? `Upcoming ${safeEventType} events for the next week:`
            : `No upcoming ${safeEventType} events are currently listed for the next week.`,
        "",
        ...(Array.isArray(events) ? events : []).flatMap((event) => [
            event.title || "Untitled event",
            `When: ${formatDigestDate(event.start_date_time)}`,
            `Where: ${formatDigestLocation(event)}`,
            event.description ? `Details: ${event.description}` : "",
            "",
        ]),
        eventsUrl ? `Browse all events: ${eventsUrl}` : "",
    ].filter((line) => line !== "");

    return {
        subject: `Mean Green Guide weekly ${safeEventType} events`,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a;">
                <h2 style="margin-bottom: 8px;">Weekly ${escapeHtml(safeEventType)} events</h2>
                <p style="margin-top: 0;">Here are the upcoming events in a category you follow.</p>
                ${listHtml}
                ${eventsUrl ? `
                    <p>
                        <a
                            href="${escapeHtml(eventsUrl)}"
                            style="display: inline-block; padding: 12px 18px; border-radius: 6px; background: ${DEFAULT_BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600;"
                        >
                            Browse Events
                        </a>
                    </p>
                ` : ""}
            </div>
        `,
        text: textLines.join("\n"),
    };
}

async function sendResendEmail({ to, subject, html, text }) {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.RESEND_FROM_EMAIL || "").trim();

    if (!apiKey || !from) {
        throw new Error("Resend email configuration is incomplete");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
            text,
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = payload.message || payload.error || "Failed to send email";
        throw new Error(`Resend request failed (${response.status}): ${errorMessage}`);
    }

    return payload;
}

async function sendPasswordResetEmail({ to, resetUrl, ttlMinutes }) {
    const message = buildResetPasswordEmail(resetUrl, ttlMinutes);
    return sendResendEmail({
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
    });
}

async function sendEventRegistrationEmail({ to, user, event }) {
    const frontendUrl = String(process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
    const eventsUrl = frontendUrl ? `${frontendUrl}/events` : "";
    const message = buildEventRegistrationEmail({ user, event, eventsUrl });

    return sendResendEmail({
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
    });
}

async function sendEventSavedEmail({ to, user, event }) {
    const frontendUrl = String(process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
    const eventsUrl = frontendUrl ? `${frontendUrl}/events` : "";
    const message = buildEventSavedEmail({ user, event, eventsUrl });

    return sendResendEmail({
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
    });
}

async function sendWeeklyEventDigestEmail({ to, eventType, events, frontendUrl }) {
    const message = buildWeeklyEventDigestEmail({ eventType, events, frontendUrl });

    return sendResendEmail({
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
    });
}

module.exports = {
    buildEventSavedEmail,
    buildEventRegistrationEmail,
    buildResetPasswordEmail,
    buildWeeklyEventDigestEmail,
    sendEventSavedEmail,
    sendEventRegistrationEmail,
    sendPasswordResetEmail,
    sendWeeklyEventDigestEmail,
};
