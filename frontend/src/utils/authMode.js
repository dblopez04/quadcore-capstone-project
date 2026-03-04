const AUTH_MODE_KEY = "authMode";

export function getAuthMode() {
    try {
        return localStorage.getItem(AUTH_MODE_KEY);
    } catch {
        return null;
    }
}

export function isGuestMode() {
    return getAuthMode() === "guest";
}

export function setGuestMode() {
    try {
        localStorage.setItem(AUTH_MODE_KEY, "guest");
    } catch {
        // ignore storage errors in unsupported environments
    }
}

export function setAuthenticatedMode() {
    try {
        localStorage.setItem(AUTH_MODE_KEY, "authenticated");
    } catch {
        // ignore storage errors in unsupported environments
    }
}

export function clearAuthMode() {
    try {
        localStorage.removeItem(AUTH_MODE_KEY);
    } catch {
        // ignore storage errors in unsupported environments
    }
}
