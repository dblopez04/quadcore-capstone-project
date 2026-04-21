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

module.exports = {
    buildEventRegistrationEmail,
    buildResetPasswordEmail,
    sendEventRegistrationEmail,
    sendPasswordResetEmail,
};
