const formatEventDateTime = (value) => {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short"
    }).format(new Date(value));
};

const buildEventReminderHtml = ({ event, frontendUrl }) => {
    const eventUrl = `${frontendUrl.replace(/\/$/, "")}/events`;
    const startsAt = formatEventDateTime(event.start_date_time);
    const endsAt = formatEventDateTime(event.end_date_time);
    const locationName = event.Location ? event.Location.name : "Campus";

    return `
        <div style="font-family: Arial, sans-serif; color: #163020; line-height: 1.5;">
            <h2 style="margin-bottom: 8px;">Reminder: ${event.title} starts in 24 hours</h2>
            <p style="margin-top: 0;">You asked to be reminded about a saved event.</p>
            <p><strong>When:</strong> ${startsAt}</p>
            <p><strong>Ends:</strong> ${endsAt}</p>
            <p><strong>Where:</strong> ${locationName}</p>
            ${event.description ? `<p>${event.description}</p>` : ""}
            <p><a href="${eventUrl}" style="color: #006b3c;">View your saved events</a></p>
        </div>
    `;
};

async function sendEventReminderEmail({ to, event }) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("Missing RESEND_API_KEY.");
    }

    if (!process.env.EMAIL_FROM) {
        throw new Error("Missing EMAIL_FROM.");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [to],
            subject: `Reminder: ${event.title} starts tomorrow`,
            html: buildEventReminderHtml({ event, frontendUrl })
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send reminder email.");
    }

    return data;
}

module.exports = { sendEventReminderEmail };
