import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticatedMode } from "../utils/authMode";
import { isAdminUser, getStoredUser } from "../utils/userSession";
import {
    createEventRequest,
    fetchAdminEvents,
    deleteAdminEvent,
} from "../api/admin";
import { searchLocations } from "../api/locationService";

function normalizeAdminEvent(ev) {
    return {
        id: ev.event_id || ev.id,
        title: ev.title || "Untitled Event",
        description: ev.description || "",
        eventType: ev.event_type || "OTHER",
        start: ev.start_date_time || null,
        end: ev.end_date_time || null,
        locationId: ev.location_id || "",
        capacity: ev.capacity ?? "",
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
        event_type: "ACADEMIC",
        capacity: ""
    });

    const [message, setMessage] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [locationResults, setLocationResults] = useState([]);
    const [searchingLocations, setSearchingLocations] = useState(false);
    const [locationPicked, setLocationPicked] = useState(false);

    const [adminEvents, setAdminEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [deletingEventId, setDeletingEventId] = useState("");

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
            event_type: "ACADEMIC",
            capacity: ""
        });
        setLocationQuery("");
        setLocationResults([]);
        setLocationPicked(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!form.location_id) {
            setMessage("Please select a location from the search results.");
            return;
        }

        try {
            await createEventRequest({
                ...form,
                organizer_id: user.user_id,
                capacity: form.capacity ? Number(form.capacity) : null
            });

            setMessage("Event created successfully!");
            resetForm();
            await loadAdminEvents();
        } catch (err) {
            setMessage(err.message || "Error creating event");
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

    return (
        <div style={{ padding: 24 }}>
            <h1>Admin Panel</h1>
            <p>Welcome, {user?.first_name || "Admin"}.</p>

            <h2>Create Event</h2>

            <form
                onSubmit={handleSubmit}
                style={{
                    maxWidth: 500,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                }}
            >
                <input
                    name="title"
                    placeholder="Title"
                    value={form.title}
                    onChange={handleChange}
                    required
                />

                <input
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
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
                                location_id: ""
                            }));
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                setLocationResults([]);
                            }, 150);
                        }}
                        required
                    />

                    {searchingLocations && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
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
                                background: "#fff",
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                marginTop: 4,
                                zIndex: 20,
                                maxHeight: 220,
                                overflowY: "auto",
                                boxShadow: "0 8px 18px rgba(0,0,0,0.08)"
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
                                        padding: "10px 12px",
                                        border: "none",
                                        background: "white",
                                        cursor: "pointer"
                                    }}
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {form.location_id && (
                    <div style={{ fontSize: 12, color: "#444" }}>
                        Selected location ID: {form.location_id}
                    </div>
                )}

                <input
                    type="datetime-local"
                    name="start_date_time"
                    value={form.start_date_time}
                    onChange={handleChange}
                    required
                />

                <input
                    type="datetime-local"
                    name="end_date_time"
                    value={form.end_date_time}
                    onChange={handleChange}
                    required
                />

                <select
                    name="event_type"
                    value={form.event_type}
                    onChange={handleChange}
                >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="SOCIAL">SOCIAL</option>
                    <option value="CAREER FAIR">CAREER FAIR</option>
                    <option value="SPORTS">SPORTS</option>
                    <option value="CULTURAL">CULTURAL</option>
                    <option value="WORKSHOP">WORKSHOP</option>
                    <option value="CONFERENCE">CONFERENCE</option>
                    <option value="SEMINAR">SEMINAR</option>
                    <option value="OTHER">OTHER</option>
                </select>

                <input
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Capacity"
                    value={form.capacity}
                    onChange={handleChange}
                />

                <button type="submit">Create Event</button>
            </form>

            {message && <p style={{ marginTop: 10 }}>{message}</p>}

            <h2 style={{ marginTop: 28 }}>Manage Events</h2>

            {loadingEvents ? (
                <p>Loading admin events...</p>
            ) : adminEvents.length === 0 ? (
                <p>No events found.</p>
            ) : (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    {adminEvents.map((ev) => (
                        <div
                            key={ev.id}
                            style={{
                                border: "1px solid #e5e5e5",
                                borderRadius: 12,
                                padding: 14,
                                background: "#fff",
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{ev.title}</h3>

                            <p style={{ margin: "6px 0", color: "#444" }}>
                                <strong>{ev.eventType}</strong>
                                {ev.description ? ` • ${ev.description}` : ""}
                            </p>

                            <p style={{ margin: "6px 0", fontSize: 14, color: "#666" }}>
                                {ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}
                                {ev.end ? ` – ${new Date(ev.end).toLocaleString()}` : ""}
                            </p>

                            <p style={{ margin: "6px 0", fontSize: 13, color: "#666" }}>
                                Status: {ev.status} | Capacity: {ev.capacity || "N/A"}
                            </p>

                            <button
                                type="button"
                                onClick={() => handleDelete(ev.id)}
                                disabled={deletingEventId === ev.id}
                                style={{
                                    marginTop: 8,
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    background: "#b42318",
                                    color: "white",
                                    border: "none",
                                    cursor: deletingEventId === ev.id ? "not-allowed" : "pointer",
                                    opacity: deletingEventId === ev.id ? 0.7 : 1,
                                }}
                            >
                                {deletingEventId === ev.id ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}