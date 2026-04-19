import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticatedMode } from "../utils/authMode";
import { getStoredUser, isAdminUser } from "../utils/userSession";
import {
    createAdminEvent,
    createAdminLocation,
    createAdminPoi,
    deleteAdminEvent,
    deleteAdminLocation,
    deleteAdminPoi,
    deleteAdminReport,
    fetchAdminEvents,
    fetchAdminLocations,
    fetchAdminPois,
    fetchAdminReports,
    fetchAdminUsers,
    grantAdminPrivileges,
    grantOwnerPrivileges,
    revokeAdminPrivileges,
    revokeOwnerPrivileges,
    updateAdminEvent,
    updateAdminLocation,
    updateAdminPoi,
    updateAdminReport,
} from "../api/admin";
import { useToast } from "../components/ToastProvider";

const ADMIN_TABS = [
    { id: "locations", label: "Locations" },
    { id: "pois", label: "POIs" },
    { id: "events", label: "Events" },
    { id: "reports", label: "Reports" },
    { id: "users", label: "Users" },
];

const POI_CATEGORIES = [
    "ACADEMIC BUILDING",
    "LIBRARY",
    "DINING HALL",
    "PARKING",
    "DORMITORY",
    "RECREATION",
    "MEDICAL",
    "LANDMARK",
    "BATHROOM",
    "RESTAURANT",
    "OTHER",
];

const EVENT_STATUSES = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED", "POSTPONED"];
const REPORT_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const REPORT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const REPORT_TYPES = [
    "INCORRECT INFORMATION",
    "MISSING CONTENT",
    "SAFETY ISSUE",
    "ACCESSIBILITY ISSUE",
    "MISSING LOCATION",
    "OTHER",
];

function createEmptyLocationForm() {
    return {
        name: "",
        description: "",
        latitude: "",
        longitude: "",
    };
}

function createEmptyPoiForm() {
    return {
        location_id: "",
        name: "",
        description: "",
        category: "OTHER",
        building_name: "",
        floor_number: "",
        room_number: "",
        is_indoor: false,
        operating_hours: "",
        contact_info: "",
        is_active: true,
    };
}

function createEmptyEventForm() {
    return {
        title: "",
        description: "",
        location_id: "",
        start_date_time: "",
        end_date_time: "",
        event_type: "",
        status: "SCHEDULED",
    };
}

function createEmptyReportForm() {
    return {
        status: "PENDING",
        priority: "MEDIUM",
        resolution_notes: "",
    };
}

function parseCoordinates(value) {
    if (Array.isArray(value?.coordinates) && value.coordinates.length >= 2) {
        return {
            longitude: value.coordinates[0],
            latitude: value.coordinates[1],
        };
    }

    if (Array.isArray(value) && value.length >= 2) {
        return {
            longitude: value[0],
            latitude: value[1],
        };
    }

    return {
        longitude: value?.longitude ?? value?.lng ?? "",
        latitude: value?.latitude ?? value?.lat ?? "",
    };
}

function toInputDateTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

function formatDateTime(value) {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatCoordinate(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return "N/A";
    return number.toFixed(6);
}

function normalizeLocation(item) {
    const coordinates = parseCoordinates(item.coordinates);

    return {
        id: item.location_id,
        name: item.name || "Untitled location",
        description: item.description || "",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
    };
}

function normalizePoi(item) {
    return {
        id: item.poi_id,
        location_id: item.location_id || "",
        name: item.name || "Untitled POI",
        description: item.description || "",
        category: item.category || "OTHER",
        building_name: item.building_name || "",
        floor_number: item.floor_number ?? "",
        room_number: item.room_number || "",
        is_indoor: Boolean(item.is_indoor),
        operating_hours: item.operating_hours || "",
        contact_info: item.contact_info || "",
        is_active: item.is_active !== false,
    };
}

function normalizeEvent(item) {
    return {
        id: item.event_id,
        title: item.title || "Untitled event",
        description: item.description || "",
        location_id: item.location_id || "",
        start_date_time: item.start_date_time || "",
        end_date_time: item.end_date_time || "",
        event_type: item.event_type || "",
        status: item.status || "SCHEDULED",
    };
}

function normalizeReport(item) {
    return {
        id: item.report_id,
        reporter_id: item.reporter_id || "",
        report_type: item.report_type || "OTHER",
        target_type: item.target_type || "",
        target_id: item.target_id || "",
        title: item.title || "Untitled report",
        description: item.description || "",
        location_id: item.location_id || "",
        priority: item.priority || "MEDIUM",
        status: item.status || "PENDING",
        created_at: item.created_at || "",
        assigned_to: item.assigned_to || "",
        resolved_at: item.resolved_at || "",
        resolved_by: item.resolved_by || "",
        resolution_notes: item.resolution_notes || "",
    };
}

function normalizeUser(item) {
    return {
        id: item.user_id,
        user_id: item.user_id,
        email: item.email || "",
        first_name: item.first_name || "",
        last_name: item.last_name || "",
        phone_number: item.phone_number || "",
        user_role: item.user_role || "VISITOR",
        is_admin: Boolean(item.is_admin),
        is_owner: Boolean(item.is_owner),
    };
}

function byName(a, b) {
    return a.name.localeCompare(b.name);
}

function byDisplayName(a, b) {
    const aName = `${a.first_name} ${a.last_name}`.trim() || a.email;
    const bName = `${b.first_name} ${b.last_name}`.trim() || b.email;
    return aName.localeCompare(bName);
}

function MetricCard({ label, value, tone = "default" }) {
    return (
        <div className={`admin-metric admin-metric--${tone}`}>
            <span className="admin-metricLabel">{label}</span>
            <strong className="admin-metricValue">{value}</strong>
        </div>
    );
}

function EmptyState({ children }) {
    return <div className="admin-empty">{children}</div>;
}

function formatUserLabel(user) {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.email || "Unknown user";
}

export default function Admin() {
    const isAuthenticated = isAuthenticatedMode();
    const hasAdminRole = isAdminUser();
    const currentSessionUser = getStoredUser();
    const { showToast } = useToast() || {};

    const [activeTab, setActiveTab] = useState("locations");
    const [bootstrapping, setBootstrapping] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [loading, setLoading] = useState({
        locations: false,
        pois: false,
        events: false,
        reports: false,
        users: false,
    });

    const [locations, setLocations] = useState([]);
    const [pois, setPois] = useState([]);
    const [events, setEvents] = useState([]);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);

    const [locationFilters, setLocationFilters] = useState({ search: "" });
    const [poiFilters, setPoiFilters] = useState({ category: "" });
    const [eventFilters, setEventFilters] = useState({ status: "" });
    const [reportFilters, setReportFilters] = useState({
        status: "",
        priority: "",
        type: "",
    });
    const [userSearch, setUserSearch] = useState("");

    const [locationForm, setLocationForm] = useState(createEmptyLocationForm());
    const [poiForm, setPoiForm] = useState(createEmptyPoiForm());
    const [eventForm, setEventForm] = useState(createEmptyEventForm());
    const [reportForm, setReportForm] = useState(createEmptyReportForm());

    const [editingLocationId, setEditingLocationId] = useState("");
    const [editingPoiId, setEditingPoiId] = useState("");
    const [editingEventId, setEditingEventId] = useState("");
    const [selectedReportId, setSelectedReportId] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");

    const locationOptions = useMemo(() => [...locations].sort(byName), [locations]);
    const currentUserRecord =
        users.find((item) => item.user_id === currentSessionUser?.user_id) || null;
    const isOwner = Boolean(currentUserRecord?.is_owner);

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();
        const sortedUsers = [...users].sort(byDisplayName);

        if (!query) {
            return sortedUsers;
        }

        return sortedUsers.filter((item) => {
            const haystack = [
                item.email,
                item.first_name,
                item.last_name,
                item.phone_number,
                item.user_role,
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [userSearch, users]);

    const selectedReport = reports.find((item) => item.id === selectedReportId) || null;
    const selectedUser = users.find((item) => item.id === selectedUserId) || null;

    async function loadLocations(options = {}) {
        const { filters = locationFilters, silent = false } = options;
        setLoading((current) => ({ ...current, locations: true }));

        try {
            const data = await fetchAdminLocations(filters);
            setLocations((Array.isArray(data) ? data : []).map(normalizeLocation));
        } catch (err) {
            setLocations([]);
            if (!silent) {
                showToast?.(err.message || "Failed to load locations.", "error");
            }
        } finally {
            setLoading((current) => ({ ...current, locations: false }));
        }
    }

    async function loadPois(options = {}) {
        const { filters = poiFilters, silent = false } = options;
        setLoading((current) => ({ ...current, pois: true }));

        try {
            const data = await fetchAdminPois(filters);
            setPois((Array.isArray(data) ? data : []).map(normalizePoi));
        } catch (err) {
            setPois([]);
            if (!silent) {
                showToast?.(err.message || "Failed to load POIs.", "error");
            }
        } finally {
            setLoading((current) => ({ ...current, pois: false }));
        }
    }

    async function loadEvents(options = {}) {
        const { filters = eventFilters, silent = false } = options;
        setLoading((current) => ({ ...current, events: true }));

        try {
            const data = await fetchAdminEvents(filters);
            setEvents((Array.isArray(data) ? data : []).map(normalizeEvent));
        } catch (err) {
            setEvents([]);
            if (!silent) {
                showToast?.(err.message || "Failed to load events.", "error");
            }
        } finally {
            setLoading((current) => ({ ...current, events: false }));
        }
    }

    async function loadReports(options = {}) {
        const { filters = reportFilters, silent = false } = options;
        setLoading((current) => ({ ...current, reports: true }));

        try {
            const data = await fetchAdminReports(filters);
            setReports((Array.isArray(data) ? data : []).map(normalizeReport));
        } catch (err) {
            setReports([]);
            if (!silent) {
                showToast?.(err.message || "Failed to load reports.", "error");
            }
        } finally {
            setLoading((current) => ({ ...current, reports: false }));
        }
    }

    async function loadUsers(options = {}) {
        const { silent = false } = options;
        setLoading((current) => ({ ...current, users: true }));

        try {
            const data = await fetchAdminUsers();
            setUsers((Array.isArray(data) ? data : []).map(normalizeUser));
        } catch (err) {
            setUsers([]);
            if (!silent) {
                showToast?.(err.message || "Failed to load users.", "error");
            }
        } finally {
            setLoading((current) => ({ ...current, users: false }));
        }
    }

    useEffect(() => {
        let active = true;

        async function loadAll() {
            setBootstrapping(true);

            setLoading({
                locations: true,
                pois: true,
                events: true,
                reports: true,
                users: true,
            });

            const results = await Promise.allSettled([
                fetchAdminLocations(),
                fetchAdminPois(),
                fetchAdminEvents(),
                fetchAdminReports(),
                fetchAdminUsers(),
            ]);

            if (!active) {
                return;
            }

            const [locationsResult, poisResult, eventsResult, reportsResult, usersResult] = results;

            setLocations(
                locationsResult.status === "fulfilled"
                    ? (Array.isArray(locationsResult.value) ? locationsResult.value : []).map(
                          normalizeLocation
                      )
                    : []
            );

            setPois(
                poisResult.status === "fulfilled"
                    ? (Array.isArray(poisResult.value) ? poisResult.value : []).map(normalizePoi)
                    : []
            );

            setEvents(
                eventsResult.status === "fulfilled"
                    ? (Array.isArray(eventsResult.value) ? eventsResult.value : []).map(normalizeEvent)
                    : []
            );

            setReports(
                reportsResult.status === "fulfilled"
                    ? (Array.isArray(reportsResult.value) ? reportsResult.value : []).map(normalizeReport)
                    : []
            );

            setUsers(
                usersResult.status === "fulfilled"
                    ? (Array.isArray(usersResult.value) ? usersResult.value : []).map(normalizeUser)
                    : []
            );

            setLoading({
                locations: false,
                pois: false,
                events: false,
                reports: false,
                users: false,
            });

            if (active) {
                setBootstrapping(false);
            }
        }

        loadAll();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (selectedReportId && !reports.some((item) => item.id === selectedReportId)) {
            setSelectedReportId("");
            setReportForm(createEmptyReportForm());
        }
    }, [reports, selectedReportId]);

    useEffect(() => {
        if (selectedUserId && !users.some((item) => item.id === selectedUserId)) {
            setSelectedUserId("");
        }
    }, [selectedUserId, users]);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!hasAdminRole) {
        return (
            <div className="admin-denied">
                <h2>Access denied</h2>
                <p>You do not have permission to view the admin console.</p>
            </div>
        );
    }

    async function runBusyAction(key, action) {
        setBusyKey(key);

        try {
            await action();
        } finally {
            setBusyKey("");
        }
    }

    function resetLocationForm() {
        setEditingLocationId("");
        setLocationForm(createEmptyLocationForm());
    }

    function resetPoiForm() {
        setEditingPoiId("");
        setPoiForm(createEmptyPoiForm());
    }

    function resetEventForm() {
        setEditingEventId("");
        setEventForm(createEmptyEventForm());
    }

    function handleLocationFieldChange(event) {
        const { name, value } = event.target;
        setLocationForm((current) => ({ ...current, [name]: value }));
    }

    function handlePoiFieldChange(event) {
        const { name, value, type, checked } = event.target;
        setPoiForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handleEventFieldChange(event) {
        const { name, value } = event.target;
        setEventForm((current) => ({ ...current, [name]: value }));
    }

    function handleReportFieldChange(event) {
        const { name, value } = event.target;
        setReportForm((current) => ({ ...current, [name]: value }));
    }

    function startEditingLocation(item) {
        setEditingLocationId(item.id);
        setLocationForm({
            name: item.name,
            description: item.description,
            latitude: item.latitude === "" ? "" : String(item.latitude),
            longitude: item.longitude === "" ? "" : String(item.longitude),
        });
        setActiveTab("locations");
    }

    function startEditingPoi(item) {
        setEditingPoiId(item.id);
        setPoiForm({
            location_id: item.location_id,
            name: item.name,
            description: item.description,
            category: item.category,
            building_name: item.building_name,
            floor_number: item.floor_number === "" ? "" : String(item.floor_number),
            room_number: item.room_number,
            is_indoor: item.is_indoor,
            operating_hours: item.operating_hours,
            contact_info: item.contact_info,
            is_active: item.is_active,
        });
        setActiveTab("pois");
    }

    function startEditingEvent(item) {
        setEditingEventId(item.id);
        setEventForm({
            title: item.title,
            description: item.description,
            location_id: item.location_id,
            start_date_time: toInputDateTime(item.start_date_time),
            end_date_time: toInputDateTime(item.end_date_time),
            event_type: item.event_type,
            status: item.status,
        });
        setActiveTab("events");
    }

    function startEditingReport(item) {
        setSelectedReportId(item.id);
        setReportForm({
            status: item.status,
            priority: item.priority,
            resolution_notes: item.resolution_notes,
        });
        setActiveTab("reports");
    }

    function startManagingUser(item) {
        setSelectedUserId(item.id);
        setActiveTab("users");
    }

    async function handleLocationSubmit(event) {
        event.preventDefault();

        const latitude = Number(locationForm.latitude);
        const longitude = Number(locationForm.longitude);

        if (!locationForm.name.trim()) {
            showToast?.("Location name is required.", "error");
            return;
        }

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            showToast?.("Latitude and longitude must be valid numbers.", "error");
            return;
        }

        const payload = {
            name: locationForm.name.trim(),
            description: locationForm.description.trim(),
            coordinates: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
        };

        await runBusyAction("save-location", async () => {
            if (editingLocationId) {
                await updateAdminLocation(editingLocationId, payload);
                showToast?.("Location updated.", "success");
            } else {
                await createAdminLocation(payload);
                showToast?.("Location created.", "success");
            }

            resetLocationForm();
            await Promise.all([
                loadLocations({ silent: true }),
                loadPois({ silent: true }),
                loadEvents({ silent: true }),
            ]);
        });
    }

    async function handleLocationDelete(locationId) {
        if (!window.confirm("Delete this location?")) {
            return;
        }

        await runBusyAction(`delete-location-${locationId}`, async () => {
            await deleteAdminLocation(locationId);
            showToast?.("Location deleted.", "success");

            if (editingLocationId === locationId) {
                resetLocationForm();
            }

            await Promise.all([
                loadLocations({ silent: true }),
                loadPois({ silent: true }),
                loadEvents({ silent: true }),
            ]);
        });
    }

    async function handlePoiSubmit(event) {
        event.preventDefault();

        if (!poiForm.name.trim() || !poiForm.location_id || !poiForm.category) {
            showToast?.("Name, location, and category are required for a POI.", "error");
            return;
        }

        const payload = {
            location_id: poiForm.location_id,
            name: poiForm.name.trim(),
            description: poiForm.description.trim(),
            category: poiForm.category,
            building_name: poiForm.building_name.trim(),
            floor_number: poiForm.floor_number === "" ? null : Number(poiForm.floor_number),
            room_number: poiForm.room_number.trim(),
            is_indoor: poiForm.is_indoor,
            operating_hours: poiForm.operating_hours.trim(),
            contact_info: poiForm.contact_info.trim(),
            is_active: poiForm.is_active,
        };

        if (payload.floor_number !== null && Number.isNaN(payload.floor_number)) {
            showToast?.("Floor number must be a valid number.", "error");
            return;
        }

        await runBusyAction("save-poi", async () => {
            if (editingPoiId) {
                await updateAdminPoi(editingPoiId, payload);
                showToast?.("POI updated.", "success");
            } else {
                await createAdminPoi(payload);
                showToast?.("POI created.", "success");
            }

            resetPoiForm();
            await loadPois({ silent: true });
        });
    }

    async function handlePoiDelete(poiId) {
        if (!window.confirm("Delete this point of interest?")) {
            return;
        }

        await runBusyAction(`delete-poi-${poiId}`, async () => {
            await deleteAdminPoi(poiId);
            showToast?.("POI deleted.", "success");

            if (editingPoiId === poiId) {
                resetPoiForm();
            }

            await loadPois({ silent: true });
        });
    }

    async function handleEventSubmit(event) {
        event.preventDefault();

        if (
            !eventForm.title.trim() ||
            !eventForm.location_id ||
            !eventForm.start_date_time ||
            !eventForm.end_date_time ||
            !eventForm.event_type.trim()
        ) {
            showToast?.("Title, location, schedule, and event type are required.", "error");
            return;
        }

        const payload = {
            title: eventForm.title.trim(),
            description: eventForm.description.trim(),
            location_id: eventForm.location_id,
            start_date_time: eventForm.start_date_time,
            end_date_time: eventForm.end_date_time,
            event_type: eventForm.event_type.trim(),
            status: eventForm.status,
        };

        await runBusyAction("save-event", async () => {
            if (editingEventId) {
                await updateAdminEvent(editingEventId, payload);
                showToast?.("Event updated.", "success");
            } else {
                await createAdminEvent(payload);
                showToast?.("Event created.", "success");
            }

            resetEventForm();
            await loadEvents({ silent: true });
        });
    }

    async function handleEventDelete(eventId) {
        if (!window.confirm("Delete this event?")) {
            return;
        }

        await runBusyAction(`delete-event-${eventId}`, async () => {
            await deleteAdminEvent(eventId);
            showToast?.("Event deleted.", "success");

            if (editingEventId === eventId) {
                resetEventForm();
            }

            await loadEvents({ silent: true });
        });
    }

    async function handleReportSave(event) {
        event.preventDefault();

        if (!selectedReport) {
            showToast?.("Choose a report to update first.", "error");
            return;
        }

        await runBusyAction(`save-report-${selectedReport.id}`, async () => {
            await updateAdminReport(selectedReport.id, {
                status: reportForm.status,
                priority: reportForm.priority,
                resolution_notes: reportForm.resolution_notes.trim(),
            });

            showToast?.("Report updated.", "success");
            await loadReports({ silent: true });
        });
    }

    async function handleReportDelete(reportId) {
        if (!window.confirm("Delete this report?")) {
            return;
        }

        await runBusyAction(`delete-report-${reportId}`, async () => {
            await deleteAdminReport(reportId);
            showToast?.("Report deleted.", "success");

            if (selectedReportId === reportId) {
                setSelectedReportId("");
                setReportForm(createEmptyReportForm());
            }

            await loadReports({ silent: true });
        });
    }

    async function handlePrivilegeAction(actionName, targetUser) {
        if (!targetUser) {
            showToast?.("Choose a user first.", "error");
            return;
        }

        if (!isOwner) {
            showToast?.("Only owners can change admin privileges.", "error");
            return;
        }

        const actionMap = {
            grantAdmin: {
                label: "grant admin access",
                fn: grantAdminPrivileges,
            },
            revokeAdmin: {
                label: "revoke admin access",
                fn: revokeAdminPrivileges,
            },
            grantOwner: {
                label: "grant owner access",
                fn: grantOwnerPrivileges,
            },
            revokeOwner: {
                label: "revoke owner access",
                fn: revokeOwnerPrivileges,
            },
        };

        const config = actionMap[actionName];
        if (!config) return;

        const confirmed = window.confirm(
            `Are you sure you want to ${config.label} for ${formatUserLabel(targetUser)}?`
        );

        if (!confirmed) {
            return;
        }

        await runBusyAction(`${actionName}-${targetUser.id}`, async () => {
            const result = await config.fn(targetUser.id);

            if (
                actionName === "revokeAdmin" &&
                targetUser.user_id === currentSessionUser?.user_id &&
                result?.restored_role
            ) {
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...(currentSessionUser || {}),
                        user_role: result.restored_role,
                    })
                );
            }

            showToast?.(result?.message || "Privileges updated.", "success");
            await loadUsers({ silent: true });
        });
    }

    function renderLocationsTab() {
        return (
            <div className="admin-grid">
                <section className="admin-panel">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>Location Catalog</h2>
                            <p>Search and maintain campus map anchors.</p>
                        </div>
                        <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            onClick={() => loadLocations()}
                            disabled={loading.locations}
                        >
                            {loading.locations ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <form
                        className="admin-toolbar admin-toolbar--compact"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadLocations();
                        }}
                    >
                        <input
                            className="admin-input"
                            value={locationFilters.search}
                            onChange={(event) =>
                                setLocationFilters({ search: event.target.value })
                            }
                            placeholder="Search locations by name"
                        />
                        <button type="submit" className="admin-button admin-button--primary">
                            Apply
                        </button>
                    </form>

                    <div className="admin-list">
                        {loading.locations && locations.length === 0 ? (
                            <EmptyState>Loading locations...</EmptyState>
                        ) : locations.length === 0 ? (
                            <EmptyState>No locations match the current filter.</EmptyState>
                        ) : (
                            locations.map((item) => (
                                <article key={item.id} className="admin-card">
                                    <div className="admin-cardHeader">
                                        <div>
                                            <h3>{item.name}</h3>
                                            <p>
                                                {item.description || "No description provided."}
                                            </p>
                                        </div>
                                        <span className="admin-badge">Location</span>
                                    </div>

                                    <div className="admin-meta">
                                        <span>Lat {formatCoordinate(item.latitude)}</span>
                                        <span>Lng {formatCoordinate(item.longitude)}</span>
                                    </div>

                                    <div className="admin-inlineActions">
                                        <button
                                            type="button"
                                            className="admin-button admin-button--secondary"
                                            onClick={() => startEditingLocation(item)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="admin-button admin-button--danger"
                                            onClick={() => handleLocationDelete(item.id)}
                                            disabled={busyKey === `delete-location-${item.id}`}
                                        >
                                            {busyKey === `delete-location-${item.id}`
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="admin-panel admin-panel--accent">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>{editingLocationId ? "Edit Location" : "New Location"}</h2>
                            <p>Coordinates are stored as PostGIS points.</p>
                        </div>
                        {editingLocationId && (
                            <button
                                type="button"
                                className="admin-button admin-button--ghost"
                                onClick={resetLocationForm}
                            >
                                Cancel edit
                            </button>
                        )}
                    </div>

                    <form className="admin-form" onSubmit={handleLocationSubmit}>
                        <label className="admin-field">
                            <span>Name</span>
                            <input
                                className="admin-input"
                                name="name"
                                value={locationForm.name}
                                onChange={handleLocationFieldChange}
                                placeholder="Gateway Center"
                            />
                        </label>

                        <label className="admin-field">
                            <span>Description</span>
                            <textarea
                                className="admin-input admin-textarea"
                                name="description"
                                value={locationForm.description}
                                onChange={handleLocationFieldChange}
                                placeholder="Short location description"
                            />
                        </label>

                        <div className="admin-fieldsTwoUp">
                            <label className="admin-field">
                                <span>Latitude</span>
                                <input
                                    className="admin-input"
                                    name="latitude"
                                    value={locationForm.latitude}
                                    onChange={handleLocationFieldChange}
                                    placeholder="33.2100"
                                />
                            </label>

                            <label className="admin-field">
                                <span>Longitude</span>
                                <input
                                    className="admin-input"
                                    name="longitude"
                                    value={locationForm.longitude}
                                    onChange={handleLocationFieldChange}
                                    placeholder="-97.1500"
                                />
                            </label>
                        </div>

                        <div className="admin-formActions">
                            <button
                                type="submit"
                                className="admin-button admin-button--primary"
                                disabled={busyKey === "save-location"}
                            >
                                {busyKey === "save-location"
                                    ? "Saving..."
                                    : editingLocationId
                                        ? "Save location"
                                        : "Create location"}
                            </button>
                            <button
                                type="button"
                                className="admin-button admin-button--ghost"
                                onClick={resetLocationForm}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        );
    }

    function renderPoisTab() {
        return (
            <div className="admin-grid">
                <section className="admin-panel">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>Points of Interest</h2>
                            <p>Maintain searchable buildings, services, and amenities.</p>
                        </div>
                        <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            onClick={() => loadPois()}
                            disabled={loading.pois}
                        >
                            {loading.pois ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <form
                        className="admin-toolbar admin-toolbar--compact"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadPois();
                        }}
                    >
                        <select
                            className="admin-input"
                            value={poiFilters.category}
                            onChange={(event) =>
                                setPoiFilters({ category: event.target.value })
                            }
                        >
                            <option value="">All categories</option>
                            {POI_CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="admin-button admin-button--primary">
                            Apply
                        </button>
                    </form>

                    <div className="admin-list">
                        {loading.pois && pois.length === 0 ? (
                            <EmptyState>Loading POIs...</EmptyState>
                        ) : pois.length === 0 ? (
                            <EmptyState>No POIs match the current filter.</EmptyState>
                        ) : (
                            pois.map((item) => {
                                const location = locations.find(
                                    (entry) => entry.id === item.location_id
                                );

                                return (
                                    <article key={item.id} className="admin-card">
                                        <div className="admin-cardHeader">
                                            <div>
                                                <h3>{item.name}</h3>
                                                <p>
                                                    {item.description || "No description provided."}
                                                </p>
                                            </div>
                                            <span className="admin-badge">{item.category}</span>
                                        </div>

                                        <div className="admin-meta">
                                            <span>{location?.name || "Unknown location"}</span>
                                            <span>{item.is_indoor ? "Indoor" : "Outdoor"}</span>
                                            <span>{item.is_active ? "Active" : "Inactive"}</span>
                                        </div>

                                        <div className="admin-inlineActions">
                                            <button
                                                type="button"
                                                className="admin-button admin-button--secondary"
                                                onClick={() => startEditingPoi(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-button admin-button--danger"
                                                onClick={() => handlePoiDelete(item.id)}
                                                disabled={busyKey === `delete-poi-${item.id}`}
                                            >
                                                {busyKey === `delete-poi-${item.id}`
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="admin-panel admin-panel--accent">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>{editingPoiId ? "Edit POI" : "New POI"}</h2>
                            <p>Use POIs for searchable campus detail beyond base locations.</p>
                        </div>
                        {editingPoiId && (
                            <button
                                type="button"
                                className="admin-button admin-button--ghost"
                                onClick={resetPoiForm}
                            >
                                Cancel edit
                            </button>
                        )}
                    </div>

                    <form className="admin-form" onSubmit={handlePoiSubmit}>
                        <div className="admin-fieldsTwoUp">
                            <label className="admin-field">
                                <span>Name</span>
                                <input
                                    className="admin-input"
                                    name="name"
                                    value={poiForm.name}
                                    onChange={handlePoiFieldChange}
                                    placeholder="Willis Library"
                                />
                            </label>

                            <label className="admin-field">
                                <span>Category</span>
                                <select
                                    className="admin-input"
                                    name="category"
                                    value={poiForm.category}
                                    onChange={handlePoiFieldChange}
                                >
                                    {POI_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="admin-field">
                            <span>Base location</span>
                            <select
                                className="admin-input"
                                name="location_id"
                                value={poiForm.location_id}
                                onChange={handlePoiFieldChange}
                            >
                                <option value="">Select a location</option>
                                {locationOptions.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="admin-field">
                            <span>Description</span>
                            <textarea
                                className="admin-input admin-textarea"
                                name="description"
                                value={poiForm.description}
                                onChange={handlePoiFieldChange}
                                placeholder="Describe what students will find here"
                            />
                        </label>

                        <div className="admin-fieldsTwoUp">
                            <label className="admin-field">
                                <span>Building name</span>
                                <input
                                    className="admin-input"
                                    name="building_name"
                                    value={poiForm.building_name}
                                    onChange={handlePoiFieldChange}
                                />
                            </label>

                            <label className="admin-field">
                                <span>Floor</span>
                                <input
                                    className="admin-input"
                                    name="floor_number"
                                    value={poiForm.floor_number}
                                    onChange={handlePoiFieldChange}
                                />
                            </label>
                        </div>

                        <div className="admin-fieldsTwoUp">
                            <label className="admin-field">
                                <span>Room</span>
                                <input
                                    className="admin-input"
                                    name="room_number"
                                    value={poiForm.room_number}
                                    onChange={handlePoiFieldChange}
                                />
                            </label>

                            <label className="admin-field">
                                <span>Hours</span>
                                <input
                                    className="admin-input"
                                    name="operating_hours"
                                    value={poiForm.operating_hours}
                                    onChange={handlePoiFieldChange}
                                    placeholder="Mon-Fri 8am-6pm"
                                />
                            </label>
                        </div>

                        <label className="admin-field">
                            <span>Contact info</span>
                            <textarea
                                className="admin-input admin-textarea admin-textarea--short"
                                name="contact_info"
                                value={poiForm.contact_info}
                                onChange={handlePoiFieldChange}
                                placeholder="Email, phone, or URL"
                            />
                        </label>

                        <div className="admin-checkboxRow">
                            <label className="admin-check">
                                <input
                                    type="checkbox"
                                    name="is_indoor"
                                    checked={poiForm.is_indoor}
                                    onChange={handlePoiFieldChange}
                                />
                                <span>Indoor location</span>
                            </label>

                            <label className="admin-check">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={poiForm.is_active}
                                    onChange={handlePoiFieldChange}
                                />
                                <span>Active listing</span>
                            </label>
                        </div>

                        <div className="admin-formActions">
                            <button
                                type="submit"
                                className="admin-button admin-button--primary"
                                disabled={busyKey === "save-poi"}
                            >
                                {busyKey === "save-poi"
                                    ? "Saving..."
                                    : editingPoiId
                                        ? "Save POI"
                                        : "Create POI"}
                            </button>
                            <button
                                type="button"
                                className="admin-button admin-button--ghost"
                                onClick={resetPoiForm}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        );
    }

    function renderEventsTab() {
        return (
            <div className="admin-grid">
                <section className="admin-panel">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>Event Schedule</h2>
                            <p>Create and maintain upcoming campus events.</p>
                        </div>
                        <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            onClick={() => loadEvents()}
                            disabled={loading.events}
                        >
                            {loading.events ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <form
                        className="admin-toolbar admin-toolbar--compact"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadEvents();
                        }}
                    >
                        <select
                            className="admin-input"
                            value={eventFilters.status}
                            onChange={(event) =>
                                setEventFilters({ status: event.target.value })
                            }
                        >
                            <option value="">All statuses</option>
                            {EVENT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="admin-button admin-button--primary">
                            Apply
                        </button>
                    </form>

                    <div className="admin-list">
                        {loading.events && events.length === 0 ? (
                            <EmptyState>Loading events...</EmptyState>
                        ) : events.length === 0 ? (
                            <EmptyState>No events match the current filter.</EmptyState>
                        ) : (
                            events.map((item) => {
                                const location = locations.find(
                                    (entry) => entry.id === item.location_id
                                );

                                return (
                                    <article key={item.id} className="admin-card">
                                        <div className="admin-cardHeader">
                                            <div>
                                                <h3>{item.title}</h3>
                                                <p>
                                                    {item.description || "No description provided."}
                                                </p>
                                            </div>
                                            <span className="admin-badge">{item.status}</span>
                                        </div>

                                        <div className="admin-meta admin-meta--stacked">
                                            <span>{location?.name || "Unknown location"}</span>
                                            <span>{item.event_type || "General event"}</span>
                                            <span>{formatDateTime(item.start_date_time)}</span>
                                        </div>

                                        <div className="admin-inlineActions">
                                            <button
                                                type="button"
                                                className="admin-button admin-button--secondary"
                                                onClick={() => startEditingEvent(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-button admin-button--danger"
                                                onClick={() => handleEventDelete(item.id)}
                                                disabled={busyKey === `delete-event-${item.id}`}
                                            >
                                                {busyKey === `delete-event-${item.id}`
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="admin-panel admin-panel--accent">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>{editingEventId ? "Edit Event" : "New Event"}</h2>
                            <p>Events require a valid location reference.</p>
                        </div>
                        {editingEventId && (
                            <button
                                type="button"
                                className="admin-button admin-button--ghost"
                                onClick={resetEventForm}
                            >
                                Cancel edit
                            </button>
                        )}
                    </div>

                    <form className="admin-form" onSubmit={handleEventSubmit}>
                        <label className="admin-field">
                            <span>Title</span>
                            <input
                                className="admin-input"
                                name="title"
                                value={eventForm.title}
                                onChange={handleEventFieldChange}
                                placeholder="Orientation kickoff"
                            />
                        </label>

                        <label className="admin-field">
                            <span>Description</span>
                            <textarea
                                className="admin-input admin-textarea"
                                name="description"
                                value={eventForm.description}
                                onChange={handleEventFieldChange}
                            />
                        </label>

                        <div className="admin-fieldsTwoUp admin-fieldsTwoUp--adaptive">
                            <label className="admin-field">
                                <span>Location</span>
                                <select
                                    className="admin-input"
                                    name="location_id"
                                    value={eventForm.location_id}
                                    onChange={handleEventFieldChange}
                                >
                                    <option value="">Select a location</option>
                                    {locationOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="admin-field">
                                <span>Type</span>
                                <input
                                    className="admin-input"
                                    name="event_type"
                                    value={eventForm.event_type}
                                    onChange={handleEventFieldChange}
                                    placeholder="WORKSHOP"
                                />
                            </label>
                        </div>

                        <div className="admin-fieldsTwoUp admin-fieldsTwoUp--adaptive">
                            <label className="admin-field">
                                <span>Starts</span>
                                <input
                                    className="admin-input"
                                    type="datetime-local"
                                    name="start_date_time"
                                    value={eventForm.start_date_time}
                                    onChange={handleEventFieldChange}
                                />
                            </label>

                            <label className="admin-field">
                                <span>Ends</span>
                                <input
                                    className="admin-input"
                                    type="datetime-local"
                                    name="end_date_time"
                                    value={eventForm.end_date_time}
                                    onChange={handleEventFieldChange}
                                />
                            </label>
                        </div>

                        <label className="admin-field">
                            <span>Status</span>
                            <select
                                className="admin-input"
                                name="status"
                                value={eventForm.status}
                                onChange={handleEventFieldChange}
                            >
                                {EVENT_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="admin-formActions">
                            <button
                                type="submit"
                                className="admin-button admin-button--primary"
                                disabled={busyKey === "save-event"}
                            >
                                {busyKey === "save-event"
                                    ? "Saving..."
                                    : editingEventId
                                        ? "Save event"
                                        : "Create event"}
                            </button>
                            <button
                                type="button"
                                className="admin-button admin-button--ghost"
                                onClick={resetEventForm}
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        );
    }

    function renderReportsTab() {
        return (
            <div className="admin-grid">
                <section className="admin-panel">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>Incident Reports</h2>
                            <p>Review submissions, prioritize them, and resolve completed work.</p>
                        </div>
                        <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            onClick={() => loadReports()}
                            disabled={loading.reports}
                        >
                            {loading.reports ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <form
                        className="admin-toolbar"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadReports();
                        }}
                    >
                        <select
                            className="admin-input"
                            value={reportFilters.status}
                            onChange={(event) =>
                                setReportFilters((current) => ({
                                    ...current,
                                    status: event.target.value,
                                }))
                            }
                        >
                            <option value="">All statuses</option>
                            {REPORT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>

                        <select
                            className="admin-input"
                            value={reportFilters.priority}
                            onChange={(event) =>
                                setReportFilters((current) => ({
                                    ...current,
                                    priority: event.target.value,
                                }))
                            }
                        >
                            <option value="">All priorities</option>
                            {REPORT_PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>

                        <select
                            className="admin-input"
                            value={reportFilters.type}
                            onChange={(event) =>
                                setReportFilters((current) => ({
                                    ...current,
                                    type: event.target.value,
                                }))
                            }
                        >
                            <option value="">All report types</option>
                            {REPORT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="admin-button admin-button--primary">
                            Apply
                        </button>
                    </form>

                    <div className="admin-list">
                        {loading.reports && reports.length === 0 ? (
                            <EmptyState>Loading reports...</EmptyState>
                        ) : reports.length === 0 ? (
                            <EmptyState>No reports match the current filters.</EmptyState>
                        ) : (
                            reports.map((item) => (
                                <article
                                    key={item.id}
                                    className={`admin-card ${
                                        selectedReportId === item.id ? "admin-card--selected" : ""
                                    }`}
                                >
                                    <div className="admin-cardHeader">
                                        <div>
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                        <span className="admin-badge">{item.status}</span>
                                    </div>

                                    <div className="admin-meta admin-meta--stacked">
                                        <span>{item.report_type}</span>
                                        <span>Priority {item.priority}</span>
                                        <span>{formatDateTime(item.created_at)}</span>
                                    </div>

                                    <div className="admin-inlineActions">
                                        <button
                                            type="button"
                                            className="admin-button admin-button--secondary"
                                            onClick={() => startEditingReport(item)}
                                        >
                                            Manage
                                        </button>
                                        <button
                                            type="button"
                                            className="admin-button admin-button--danger"
                                            onClick={() => handleReportDelete(item.id)}
                                            disabled={busyKey === `delete-report-${item.id}`}
                                        >
                                            {busyKey === `delete-report-${item.id}`
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="admin-panel admin-panel--accent">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>Report Workflow</h2>
                            <p>Pick a report from the list to update its workflow state.</p>
                        </div>
                    </div>

                    {!selectedReport ? (
                        <EmptyState>Select a report to edit its status and notes.</EmptyState>
                    ) : (
                        <form className="admin-form" onSubmit={handleReportSave}>
                            <div className="admin-detailBlock">
                                <strong>{selectedReport.title}</strong>
                                <p>{selectedReport.description}</p>
                                <div className="admin-meta admin-meta--stacked">
                                    <span>Target {selectedReport.target_type}</span>
                                    <span>Reporter {selectedReport.reporter_id}</span>
                                    <span>Created {formatDateTime(selectedReport.created_at)}</span>
                                </div>
                            </div>

                            <div className="admin-fieldsTwoUp">
                                <label className="admin-field">
                                    <span>Status</span>
                                    <select
                                        className="admin-input"
                                        name="status"
                                        value={reportForm.status}
                                        onChange={handleReportFieldChange}
                                    >
                                        {REPORT_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="admin-field">
                                    <span>Priority</span>
                                    <select
                                        className="admin-input"
                                        name="priority"
                                        value={reportForm.priority}
                                        onChange={handleReportFieldChange}
                                    >
                                        {REPORT_PRIORITIES.map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label className="admin-field">
                                <span>Resolution notes</span>
                                <textarea
                                    className="admin-input admin-textarea"
                                    name="resolution_notes"
                                    value={reportForm.resolution_notes}
                                    onChange={handleReportFieldChange}
                                    placeholder="Summarize action taken or why the report was rejected."
                                />
                            </label>

                            <div className="admin-formActions">
                                <button
                                    type="submit"
                                    className="admin-button admin-button--primary"
                                    disabled={busyKey === `save-report-${selectedReport.id}`}
                                >
                                    {busyKey === `save-report-${selectedReport.id}`
                                        ? "Saving..."
                                        : "Save report"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        );
    }

    function renderUsersTab() {
        const ownerCount = users.filter((item) => item.is_owner).length;

        return (
            <div className="admin-grid">
                <section className="admin-panel">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>User Access</h2>
                            <p>Review account roles and owner/admin coverage.</p>
                        </div>
                        <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            onClick={() => loadUsers()}
                            disabled={loading.users}
                        >
                            {loading.users ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <div className="admin-toolbar admin-toolbar--compact">
                        <input
                            className="admin-input"
                            value={userSearch}
                            onChange={(event) => setUserSearch(event.target.value)}
                            placeholder="Search users by name, email, role, or phone"
                        />
                    </div>

                    <div className="admin-note">
                        <strong>{ownerCount}</strong> site owner{ownerCount === 1 ? "" : "s"} configured.
                    </div>

                    <div className="admin-list">
                        {loading.users && users.length === 0 ? (
                            <EmptyState>Loading users...</EmptyState>
                        ) : filteredUsers.length === 0 ? (
                            <EmptyState>No users match the current search.</EmptyState>
                        ) : (
                            filteredUsers.map((item) => (
                                <article
                                    key={item.id}
                                    className={`admin-card ${
                                        selectedUserId === item.id ? "admin-card--selected" : ""
                                    }`}
                                >
                                    <div className="admin-cardHeader">
                                        <div>
                                            <h3>{formatUserLabel(item)}</h3>
                                            <p>{item.email}</p>
                                        </div>
                                        <span className="admin-badge">{item.user_role}</span>
                                    </div>

                                    <div className="admin-meta">
                                        <span>{item.phone_number || "No phone"}</span>
                                        <span>{item.is_admin ? "Admin" : "Standard user"}</span>
                                        <span>{item.is_owner ? "Owner" : "Not owner"}</span>
                                    </div>

                                    <div className="admin-inlineActions">
                                        <button
                                            type="button"
                                            className="admin-button admin-button--secondary"
                                            onClick={() => startManagingUser(item)}
                                        >
                                            Manage
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="admin-panel admin-panel--accent">
                    <div className="admin-sectionHeader">
                        <div>
                            <h2>Privilege Controls</h2>
                            <p>
                                {isOwner
                                    ? "Owner-only actions are enabled."
                                    : "Only owners can grant or revoke admin and owner roles."}
                            </p>
                        </div>
                    </div>

                    {!selectedUser ? (
                        <EmptyState>Select a user to manage their privileges.</EmptyState>
                    ) : (
                        <div className="admin-form">
                            <div className="admin-detailBlock">
                                <strong>{formatUserLabel(selectedUser)}</strong>
                                <p>{selectedUser.email}</p>
                                <div className="admin-meta admin-meta--stacked">
                                    <span>Base role {selectedUser.user_role}</span>
                                    <span>
                                        Access {selectedUser.is_admin ? "Admin" : "Standard user"}
                                    </span>
                                    <span>
                                        Owner status {selectedUser.is_owner ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                            </div>

                            {!isOwner && (
                                <div className="admin-note">
                                    You can review user access here, but delegation endpoints are
                                    owner-only.
                                </div>
                            )}

                            <div className="admin-formActions admin-formActions--stacked">
                                {!selectedUser.is_admin ? (
                                    <button
                                        type="button"
                                        className="admin-button admin-button--primary"
                                        onClick={() =>
                                            handlePrivilegeAction("grantAdmin", selectedUser)
                                        }
                                        disabled={busyKey === `grantAdmin-${selectedUser.id}` || !isOwner}
                                    >
                                        {busyKey === `grantAdmin-${selectedUser.id}`
                                            ? "Granting..."
                                            : "Grant admin"}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="admin-button admin-button--danger"
                                        onClick={() =>
                                            handlePrivilegeAction("revokeAdmin", selectedUser)
                                        }
                                        disabled={busyKey === `revokeAdmin-${selectedUser.id}` || !isOwner}
                                    >
                                        {busyKey === `revokeAdmin-${selectedUser.id}`
                                            ? "Revoking..."
                                            : "Revoke admin"}
                                    </button>
                                )}

                                {selectedUser.is_admin && !selectedUser.is_owner && (
                                    <button
                                        type="button"
                                        className="admin-button admin-button--secondary"
                                        onClick={() =>
                                            handlePrivilegeAction("grantOwner", selectedUser)
                                        }
                                        disabled={busyKey === `grantOwner-${selectedUser.id}` || !isOwner}
                                    >
                                        {busyKey === `grantOwner-${selectedUser.id}`
                                            ? "Granting..."
                                            : "Grant owner"}
                                    </button>
                                )}

                                {selectedUser.is_owner && (
                                    <button
                                        type="button"
                                        className="admin-button admin-button--secondary"
                                        onClick={() =>
                                            handlePrivilegeAction("revokeOwner", selectedUser)
                                        }
                                        disabled={busyKey === `revokeOwner-${selectedUser.id}` || !isOwner}
                                    >
                                        {busyKey === `revokeOwner-${selectedUser.id}`
                                            ? "Revoking..."
                                            : "Revoke owner"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        );
    }

    function renderActiveTab() {
        switch (activeTab) {
            case "locations":
                return renderLocationsTab();
            case "pois":
                return renderPoisTab();
            case "events":
                return renderEventsTab();
            case "reports":
                return renderReportsTab();
            case "users":
                return renderUsersTab();
            default:
                return null;
        }
    }

    return (
        <div className="admin-page">
            <section className="admin-metricsGrid">
                <MetricCard label="Locations" value={locations.length} tone="green" />
                <MetricCard label="POIs" value={pois.length} tone="blue" />
                <MetricCard label="Events" value={events.length} tone="gold" />
                <MetricCard label="Reports" value={reports.length} tone="rose" />
                <MetricCard
                    label="Owners"
                    value={users.filter((item) => item.is_owner).length}
                    tone="ink"
                />
            </section>

            <nav className="admin-tabs" aria-label="Admin sections">
                {ADMIN_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`admin-tab ${
                            activeTab === tab.id ? "admin-tab--active" : ""
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {bootstrapping ? <EmptyState>Loading admin data...</EmptyState> : renderActiveTab()}
        </div>
    );
}
