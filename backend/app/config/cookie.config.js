const ACCESS_COOKIE_MAX_AGE_MS = 30 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SAME_SITE = "lax";

function resolveBooleanEnv(rawValue, fallback) {
    if (typeof rawValue === "undefined") {
        return fallback;
    }

    return String(rawValue).toLowerCase() === "true";
}

function resolveSameSite() {
    const raw = String(process.env.COOKIE_SAMESITE || DEFAULT_SAME_SITE).toLowerCase();
    if (raw === "strict" || raw === "none" || raw === "lax") {
        return raw;
    }

    return DEFAULT_SAME_SITE;
}

function getCookieBaseOptions() {
    const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
    const secure = resolveBooleanEnv(process.env.COOKIE_SECURE, isProduction);

    const options = {
        httpOnly: true,
        path: "/",
        sameSite: resolveSameSite()
    };

    if (secure) {
        options.secure = true;
    }

    if (process.env.COOKIE_DOMAIN) {
        options.domain = process.env.COOKIE_DOMAIN;
    }

    return options;
}

function getAccessCookieOptions() {
    return {
        ...getCookieBaseOptions(),
        maxAge: ACCESS_COOKIE_MAX_AGE_MS
    };
}

function getRefreshCookieOptions() {
    return {
        ...getCookieBaseOptions(),
        maxAge: REFRESH_COOKIE_MAX_AGE_MS
    };
}

function getClearCookieOptions() {
    return getCookieBaseOptions();
}

module.exports = {
    getAccessCookieOptions,
    getRefreshCookieOptions,
    getClearCookieOptions
};
