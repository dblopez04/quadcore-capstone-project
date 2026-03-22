export function getStoredUser() {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearStoredUser() {
    try {
        localStorage.removeItem("user");
    } catch {
        // ignore storage errors
    }
}

export function isAdminUser() {
    const user = getStoredUser();
    if (!user) return false;

    return user.user_role === "ADMIN" || user.user_role === "OWNER";
}