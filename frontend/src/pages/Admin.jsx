import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticatedMode } from "../utils/authMode";
import { isAdminUser, getStoredUser } from "../utils/userSession";
import {
    createEventRequest,
    fetchAdminEvents,
    deleteAdminEvent,
    updateAdminEvent,
} from "../api/admin";
import { searchLocations, getAllLocations } from "../api/locationService";

function normalizeAdminEvent(ev) {
    return {
        id: ev.event_id || ev.id,
        title: ev.title || "Untitled Event",
        description: ev.description || "",
        eventType: ev.event_type || "OTHER",
        start: ev.start_date_time || null,
        end: ev.end_date_time || null,
        locationId: ev.location_id || "",
        locationName:
            ev.location_name ||
            ev.location?.name ||
            ev.locationName ||
            "",
        status: ev.status || "SCHEDULED",
    };
}

export default function Admin() {
    const isAuthenticated = isAuthenticatedMode();
    const isAdmin = isAdminUser();
    const user = getStoredUser();

    const [form, setForm] = useState({
        title: "",
        description: "",
        location_id: "",
        start_date_time: "",
        end_date_time: "",
        event_type: "",
    });

    const [message, setMessage] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [locationResults, setLocationResults] = useState([]);
    const [searchingLocations, setSearchingLocations] = useState(false);
    const [locationPicked, setLocationPicked] = useState(false);

    const [adminEvents, setAdminEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [deletingEventId, setDeletingEventId] = useState("");
    const [editingEventId, setEditingEventId] = useState(null);
    const [allLocations, setAllLocations] = useState([]);
    const [savingEvent, setSavingEvent] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 12;
    useEffect(() => {
        setCurrentPage(1);
    }, [adminEvents.length]);

    const fieldStyle = {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid var(--input-border)",
        fontSize: 16,
        outline: "none",
        background: "var(--input-bg)",
        color: "var(--input-text)",
        boxSizing: "border-box",
    };

    const handleFieldFocus = (e) => {
        e.target.style.border = "1px solid var(--unt-green)";
        e.target.style.boxShadow = "0 0 0 2px rgba(0,106,49,0.15)";
    };

    const handleFieldBlur = (e) => {
        e.target.style.border = "1px solid var(--input-border)";
        e.target.style.boxShadow = "none";
    };

    useEffect(() => {
        let active = true;

        async function runLocationSearch() {
            const q = locationQuery.trim();

            if (locationPicked) {
                setLocationResults([]);
                return;
            }

            if (!q) {
                setLocationResults([]);
                return;
            }

            try {
                setSearchingLocations(true);
                const results = await searchLocations(q);
                if (active) {
                    setLocationResults(results || []);
                }
            } catch (err) {
                console.error("Location search failed:", err);
                if (active) {
                    setLocationResults([]);
                }
            } finally {
                if (active) {
                    setSearchingLocations(false);
                }
            }
        }

        const timer = setTimeout(runLocationSearch, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [locationQuery, locationPicked]);

    useEffect(() => {
        loadAdminEvents();
    }, []);

    async function loadAdminEvents() {
        try {
            setLoadingEvents(true);
            const data = await fetchAdminEvents();
            const raw = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
            setAdminEvents(raw.map(normalizeAdminEvent));
        } catch (err) {
            console.error("Failed to load admin events:", err);
            setAdminEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    }

    useEffect(() => {
        async function loadAllLocations() {
            try {
                const locations = await getAllLocations();
                setAllLocations(locations || []);
            } catch (err) {
                console.error("Failed to load all locations:", err);
                setAllLocations([]);
            }
        }

        loadAllLocations();
    }, []);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        return (
            <div style={{ padding: 24 }}>
                <h2>Access denied</h2>
                <p>You do not have permission to view the admin page.</p>
            </div>
        );
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLocationPick = (loc) => {
        setLocationPicked(true);
        setLocationQuery(loc.name);
        setLocationResults([]);
        setForm((prev) => ({
            ...prev,
            location_id: loc.id
        }));
    };

    const resetForm = () => {
        setForm({
            title: "",
            description: "",
            location_id: "",
            start_date_time: "",
            end_date_time: "",
            event_type: "",
        });
        setLocationQuery("");
        setLocationResults([]);
        setLocationPicked(false);
        setEditingEventId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!form.location_id) {
            setMessage("Please select a location from the search results.");
            return;
        }

        try {
            setSavingEvent(true);

            if (editingEventId) {
                await updateAdminEvent(editingEventId, {
                    ...form,
                    organizer_id: user.user_id,
                });

                setMessage("Event updated successfully!");
            } else {
                await createEventRequest({
                    ...form,
                    organizer_id: user.user_id,
                });

                setMessage("Event created successfully!");
            }

            resetForm();
            await loadAdminEvents();
        } catch (err) {
            setMessage(err.message || "Error saving event");
        } finally {
            setSavingEvent(false);
        }
    };

    const handleDelete = async (eventId) => {
        const confirmed = window.confirm("Delete this event?");
        if (!confirmed) return;

        try {
            setDeletingEventId(eventId);
            setMessage("");
            await deleteAdminEvent(eventId);
            setMessage("Event deleted successfully!");
            await loadAdminEvents();
        } catch (err) {
            setMessage(err.message || "Error deleting event");
        } finally {
            setDeletingEventId("");
        }
    };

    const totalPages = Math.ceil(adminEvents.length / eventsPerPage);

    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;

    const paginatedAdminEvents = adminEvents.slice(startIndex, endIndex);

    return (
        <div
            style={{
                padding: 24,
                maxWidth: 980,
                margin: "0 auto",
            }}
        >
            <h1 style={{ marginBottom: 8 }}>Admin Panel</h1>
            <p style={{ marginTop: 0, marginBottom: 20, color: "var(--muted)" }}>
                Welcome, {user?.first_name || "Admin"}.
            </p>

            {message && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: message.toLowerCase().includes("error")
                            ? "rgba(220, 38, 38, 0.10)"
                            : "var(--unt-green-50)",
                        border: message.toLowerCase().includes("error")
                            ? "1px solid rgba(220, 38, 38, 0.35)"
                            : "1px solid var(--border)",
                        color: message.toLowerCase().includes("error")
                            ? "#dc2626"
                            : "var(--unt-green)",
                        fontSize: 14,
                    }}
                >
                    {message}
                </div>
            )}

            <div
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
                    marginBottom: 24,
                  }} 
                
            >
                <h2 style={{ marginTop: 0, marginBottom: 12 }}>Manage Events</h2>

                {loadingEvents ? (
                    <p>Loading admin events...</p>
                ) : adminEvents.length === 0 ? (
                    <p>No events found.</p>
                    ) : (
                        <>
                            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                            {paginatedAdminEvents.map((ev) => (
                            <div
                                key={ev.id}
                                style={{
                                    border: "1px solid var(--border)",
                                    borderRadius: 16,
                                    padding: 16,
                                    background: "var(--surface)",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                                }}
                            >
                                <h3 style={{ margin: 0, marginBottom: 6 }}>{ev.title}</h3>

                                    <p style={{ margin: "6px 0", color: "var(--text)", lineHeight: 1.5 }}>
                                    <strong>{ev.eventType}</strong>
                                    {ev.description ? ` - ${ev.description}` : ""}
                                </p>

                                <p style={{ margin: "6px 0", fontSize: 14, color: "var(--muted)" }}>
                                    Location: {allLocations.find((loc) => loc.id === ev.locationId)?.name || "Unknown location"}
                                </p>

                                <p style={{ margin: "6px 0", fontSize: 14, color: "var(--muted)" }}>
                                    {ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}
                                    {ev.end ? ` - ${new Date(ev.end).toLocaleString()}` : ""}
                                </p>

                                <p style={{ margin: "6px 0", fontSize: 13, color: "var(--muted)" }}>
                                    Status: {ev.status}
                                </p>

                                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                    <button
                                        type="button"
                                        disabled={editingEventId === ev.id}
                                        onClick={() => {
                                            setEditingEventId(ev.id);

                                            const matchedLocation = allLocations.find(
                                                (loc) => loc.id === ev.locationId
                                            );

                                            setLocationPicked(true);
                                            setLocationResults([]);
                                            setLocationQuery(matchedLocation?.name || "");

                                            setForm({
                                                title: ev.title,
                                                description: ev.description || "",
                                                location_id: ev.locationId,
                                                start_date_time: ev.start ? ev.start.slice(0, 16) : "",
                                                end_date_time: ev.end ? ev.end.slice(0, 16) : "",
                                                event_type: ev.eventType,
                                            });
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: "10px 12px",
                                            borderRadius: 10,
                                            background: "#1d4ed8",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: editingEventId === ev.id ? "not-allowed" : "pointer",
                                            opacity: editingEventId === ev.id ? 0.7 : 1,
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(ev.id)}
                                        disabled={deletingEventId === ev.id || editingEventId === ev.id}
                                        style={{
                                            flex: 1,
                                            padding: "10px 12px",
                                            borderRadius: 10,
                                            background: "#b42318",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor:
                                                deletingEventId === ev.id || editingEventId === ev.id
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                deletingEventId === ev.id || editingEventId === ev.id
                                                    ? 0.7
                                                    : 1,
                                        }}
                                    >
                                        {deletingEventId === ev.id
                                            ? "Deleting..."
                                            : editingEventId === ev.id
                                                ? "Editing..."
                                                : "Delete"}
                                    </button>
                                </div>
                            </div>
                            ))}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 12,
                                marginTop: 20,
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: 10,
                                    border: "1px solid var(--border)",
                                    background: currentPage === 1 ? "var(--bg)" : "var(--surface)",
                                    color: currentPage === 1 ? "var(--muted)" : "var(--text)",
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                Prev
                            </button>

                            <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                                Page {currentPage} of {totalPages || 1}
                            </span>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: 10,
                                    border: "1px solid var(--border)",
                                    background:
                                        currentPage === totalPages || totalPages === 0
                                            ? "var(--bg)"
                                            : "var(--surface)",
                                    color:
                                        currentPage === totalPages || totalPages === 0
                                            ? "var(--muted)"
                                            : "var(--text)",
                                    cursor:
                                        currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
                    marginBottom: 24,
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <h2 style={{ marginBottom: 4 }}>
                        {editingEventId ? "Edit Event" : "Create Event"}
                    </h2>

                    {editingEventId && (
                        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                            You are editing an existing event. Save changes when finished.
                        </p>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        maxWidth: 560,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <input
                        name="title"
                        placeholder="Title"
                        value={form.title}
                        onChange={handleChange}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        required
                        style={fieldStyle}
                    />

                    <input
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        style={fieldStyle}
                    />

                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Search for a location"
                            value={locationQuery}
                            onChange={(e) => {
                                setLocationPicked(false);
                                setLocationQuery(e.target.value);
                                setForm((prev) => ({
                                    ...prev,
                                    location_id: "",
                                }));
                            }}
                            onFocus={handleFieldFocus}
                            onBlur={(e) => {
                                handleFieldBlur(e);
                                setTimeout(() => {
                                    setLocationResults([]);
                                }, 150);
                            }}
                            required
                            style={fieldStyle}
                        />

                        {searchingLocations && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                                Searching locations...
                            </div>
                        )}

                        {locationResults.length > 0 && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    marginTop: 6,
                                    zIndex: 20,
                                    maxHeight: 220,
                                    overflowY: "auto",
                                    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                                }}
                            >
                                {locationResults.map((loc) => (
                                    <button
                                        key={loc.id}
                                        type="button"
                                        onMouseDown={() => handleLocationPick(loc)}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "12px 14px",
                                            border: "none",
                                            background: "var(--surface)",
                                            color: "var(--text)",
                                            cursor: "pointer",
                                            fontSize: 15,
                                        }}
                                    >
                                        {loc.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {form.location_id && (
                        <div style={{ fontSize: 13, color: "var(--muted)" }}>
                            Selected location: {allLocations.find((loc) => loc.id === form.location_id)?.name || "Unknown location"}
                        </div>
                    )}

                    <input
                        type="datetime-local"
                        name="start_date_time"
                        value={form.start_date_time}
                        onChange={handleChange}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        required
                        style={fieldStyle}
                    />

                    <input
                        type="datetime-local"
                        name="end_date_time"
                        value={form.end_date_time}
                        onChange={handleChange}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        required
                        style={fieldStyle}
                    />

                    <input
                        type="text"
                        name="event_type"
                        value={form.event_type}
                        onChange={handleChange}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        placeholder="Category"
                        required
                        style={fieldStyle}
                    />

                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                        <button
                            type="submit"
                            disabled={savingEvent}
                            style={{
                                flex: 1,
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: "none",
                                background: "#006A31",
                                color: "white",
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: savingEvent ? "not-allowed" : "pointer",
                                opacity: savingEvent ? 0.7 : 1,
                            }}
                        >
                            {savingEvent
                                ? (editingEventId ? "Saving..." : "Creating...")
                                : (editingEventId ? "Save Changes" : "Create Event")}
                        </button>

                        {editingEventId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    flex: 1,
                                    padding: "12px 14px",
                                    borderRadius: 12,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text)",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
