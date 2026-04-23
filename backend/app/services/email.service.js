const RESET_EMAIL_SUBJECT = "Reset your Mean Green Guide password";
const DEFAULT_BRAND_COLOR = "#006A31";

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDigestDate(value) {
    if (!value) return "Date not provided";

    return new Date(value).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
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

async function sendPasswordResetEmail({ to, resetUrl, ttlMinutes }) {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.RESEND_FROM_EMAIL || "").trim();

    if (!apiKey || !from) {
        throw new Error("Resend email configuration is incomplete");
    }

    const message = buildResetPasswordEmail(resetUrl, ttlMinutes);
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: message.subject,
            html: message.html,
            text: message.text,
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = payload.message || payload.error || "Failed to send reset email";
        throw new Error(`Resend request failed (${response.status}): ${errorMessage}`);
    }

    return payload;
}

async function sendWeeklyEventDigestEmail({ to, eventType, events, frontendUrl }) {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.RESEND_FROM_EMAIL || "").trim();

    if (!apiKey || !from) {
        throw new Error("Resend email configuration is incomplete");
    }

    const message = buildWeeklyEventDigestEmail({ eventType, events, frontendUrl });
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: message.subject,
            html: message.html,
            text: message.text,
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = payload.message || payload.error || "Failed to send weekly digest email";
        throw new Error(`Resend request failed (${response.status}): ${errorMessage}`);
    }

    return payload;
}

module.exports = {
    buildResetPasswordEmail,
    buildWeeklyEventDigestEmail,
    sendPasswordResetEmail,
    sendWeeklyEventDigestEmail,
};
