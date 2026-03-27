const LOCAL_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const PRODUCTION_FRONTEND_ORIGINS = ["https://www.meangreenguide.com"];

function normalizeOrigin(value) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    try {
        return new URL(trimmed).origin;
    } catch (_error) {
        return null;
    }
}

function buildAllowedOrigins({
    frontendUrl = "http://localhost:5173",
} = {}) {
    const primaryFrontendOrigin = normalizeOrigin(frontendUrl);

    return new Set([
        primaryFrontendOrigin,
        ...PRODUCTION_FRONTEND_ORIGINS.map((origin) => normalizeOrigin(origin)),
        ...LOCAL_DEV_ORIGINS.map((origin) => normalizeOrigin(origin)),
    ].filter(Boolean));
}

function isOriginAllowed(origin, allowedOrigins) {
    if (!origin) {
        return true;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    return Boolean(normalizedOrigin && allowedOrigins.has(normalizedOrigin));
}

module.exports = {
    LOCAL_DEV_ORIGINS,
    PRODUCTION_FRONTEND_ORIGINS,
    buildAllowedOrigins,
    isOriginAllowed,
    normalizeOrigin,
};
