const crypto = require("crypto");

const DEFAULT_PASSWORD_RESET_TTL_MINUTES = 15;

function getPasswordResetTtlMinutes() {
    const raw = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || DEFAULT_PASSWORD_RESET_TTL_MINUTES);
    if (Number.isFinite(raw) && raw > 0) {
        return raw;
    }

    return DEFAULT_PASSWORD_RESET_TTL_MINUTES;
}

function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

function hashPasswordResetToken(token) {
    return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function buildPasswordResetUrl(rawToken) {
    const baseUrl = String(process.env.PASSWORD_RESET_URL_BASE || "").trim();
    if (!baseUrl) {
        throw new Error("PASSWORD_RESET_URL_BASE is not configured");
    }

    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}token=${encodeURIComponent(rawToken)}`;
}

module.exports = {
    DEFAULT_PASSWORD_RESET_TTL_MINUTES,
    buildPasswordResetUrl,
    generatePasswordResetToken,
    getPasswordResetTtlMinutes,
    hashPasswordResetToken,
};
