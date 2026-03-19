import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticatedMode } from "../utils/authMode";
import { isAdminUser, getStoredUser } from "../utils/userSession";
import { createEventRequest } from "../api/admin";
import { searchLocations } from "../api/locationService";

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
    }, [locationQuery]);

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
        } catch (err) {
            setMessage(err.message || "Error creating event");
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
        </div>
    );
}