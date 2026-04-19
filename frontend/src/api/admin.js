import { apiRequest } from "./client";

function buildQueryString(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value == null) return;

        const normalizedValue = typeof value === "string" ? value.trim() : value;
        if (normalizedValue === "") return;

        params.set(key, String(normalizedValue));
    });

    const query = params.toString();
    return query ? `?${query}` : "";
}

function adminGet(path, filters) {
    return apiRequest(`${path}${buildQueryString(filters)}`, {
        method: "GET",
    });
}

function adminWrite(path, method, payload) {
    return apiRequest(path, {
        method,
        body: payload == null ? undefined : JSON.stringify(payload),
    });
}

export function fetchAdminLocations(filters) {
    return adminGet("/api/admin/locations", filters);
}

export function createAdminLocation(payload) {
    return adminWrite("/api/admin/locations", "POST", payload);
}

export function updateAdminLocation(locationId, payload) {
    return adminWrite(`/api/admin/locations/${locationId}`, "PUT", payload);
}

export function deleteAdminLocation(locationId) {
    return adminWrite(`/api/admin/locations/${locationId}`, "DELETE");
}

export function fetchAdminPois(filters) {
    return adminGet("/api/admin/pois", filters);
}

export function createAdminPoi(payload) {
    return adminWrite("/api/admin/pois", "POST", payload);
}

export function updateAdminPoi(poiId, payload) {
    return adminWrite(`/api/admin/pois/${poiId}`, "PUT", payload);
}

export function deleteAdminPoi(poiId) {
    return adminWrite(`/api/admin/pois/${poiId}`, "DELETE");
}

export function fetchAdminEvents(filters) {
    return adminGet("/api/admin/events", filters);
}

export function createAdminEvent(payload) {
    return adminWrite("/api/admin/events", "POST", payload);
}

export function updateAdminEvent(eventId, payload) {
    return adminWrite(`/api/admin/events/${eventId}`, "PUT", payload);
}

export function deleteAdminEvent(eventId) {
    return adminWrite(`/api/admin/events/${eventId}`, "DELETE");
}

export function fetchAdminReports(filters) {
    return adminGet("/api/admin/reports", filters);
}

export function updateAdminReport(reportId, payload) {
    return adminWrite(`/api/admin/reports/${reportId}`, "PUT", payload);
}

export function deleteAdminReport(reportId) {
    return adminWrite(`/api/admin/reports/${reportId}`, "DELETE");
}

export function fetchAdminUsers() {
    return adminGet("/api/admin/users");
}

export function grantAdminPrivileges(userId) {
    return adminWrite(`/api/admin/users/${userId}/grant-admin`, "POST");
}

export function revokeAdminPrivileges(userId) {
    return adminWrite(`/api/admin/users/${userId}/revoke-admin`, "POST");
}

export function grantOwnerPrivileges(userId) {
    return adminWrite(`/api/admin/users/${userId}/grant-owner`, "POST");
}

export function revokeOwnerPrivileges(userId) {
    return adminWrite(`/api/admin/users/${userId}/revoke-owner`, "POST");
}
