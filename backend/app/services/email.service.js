const RESET_EMAIL_SUBJECT = "Reset your Mean Green Guide password";
const DEFAULT_BRAND_COLOR = "#006A31";

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

module.exports = {
    buildResetPasswordEmail,
    sendPasswordResetEmail,
};
