import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchEvents,
    registerForEvent,
    fetchRegisteredEvents,
    unregisterFromEvent,
} from "../api/eventService";

function pad2(n) {
    return String(n).padStart(2, "0");
}

function toDateStr(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function eventDateStr(value) {
    if (!value) return "";
    const d = new Date(value);
    return toDateStr(d);
}

function monthLabel(d) {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function buildMonthGrid(viewDate) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = last.getDate();

    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
}

function parseEventCoords(locationValue) {
    const coordinates = locationValue?.coordinates;

    if (Array.isArray(coordinates?.coordinates) && coordinates.coordinates.length >= 2) {
        return {
            lng: coordinates.coordinates[0],
            lat: coordinates.coordinates[1],
        };
    }

    return {
        lat:
            locationValue?.lat ??
            locationValue?.latitude ??
            coordinates?.lat ??
            coordinates?.latitude ??
            null,
        lng:
            locationValue?.lng ??
            locationValue?.lon ??
            locationValue?.longitude ??
            coordinates?.lng ??
            coordinates?.lon ??
            coordinates?.longitude ??
            null,
    };
}

function normalizeEventDate(value) {
    if (!value) return null;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return String(value);
    }

    return d.toISOString();
}

function cleanText(value) {
    if (value == null) return "";
    return String(value).trim();
}

function formatRoomLabel(roomDetail) {
    const room = cleanText(roomDetail);
    if (!room) return "";
    return /[0-9]/.test(room) ? `Room ${room}` : room;
}

function formatEventLocation(ev) {
    const locationName = cleanText(ev.locationName);
    const sourceLocationName = cleanText(ev.sourceLocationName);
    const roomDetail = cleanText(ev.roomDetail);
    const baseLocation = locationName || sourceLocationName;

    if (!roomDetail) {
        return baseLocation || "Location not provided";
    }

    if (baseLocation && baseLocation.toLowerCase().includes(roomDetail.toLowerCase())) {
        return baseLocation;
    }

    const roomLabel = formatRoomLabel(roomDetail);

    if (!baseLocation) {
        return roomLabel || "Location not provided";
    }

    return roomLabel ? `${baseLocation}, ${roomLabel}` : baseLocation;
}

// Try to support both your old mock shape + backend shape
function normalizeEvent(ev) {
    const startRaw =
        ev.start_date_time ||
        ev.start_time ||
        ev.startTime ||
        ev.start ||
        ev.start_date ||
        ev.startDate;

    const endRaw =
        ev.end_date_time ||
        ev.end_time ||
        ev.endTime ||
        ev.end ||
        ev.end_date ||
        ev.endDate;

    const start = normalizeEventDate(startRaw);
    const end = normalizeEventDate(endRaw);
    const eventLocation = typeof ev.location === "object" && ev.location !== null ? ev.location : null;
    const parsedCoords = parseEventCoords(eventLocation);
    const sourceLocationName =
        ev.details?.source_location_name ||
        ev.details?.sourceLocationName ||
        ev.source_location_name ||
        ev.sourceLocationName ||
        "";
    const roomDetail =
        ev.details?.room_detail ||
        ev.details?.roomDetail ||
        ev.room_detail ||
        ev.roomDetail ||
        "";

    return {
        id: ev.event_id || ev.id || ev._id,
        title: ev.title || ev.name || "Untitled Event",
        description: ev.description || ev.details || "",
        category: ev.category || ev.event_type || ev.type || "Event",
        locationId:
            ev.location_id ||
            ev.locationId ||
            eventLocation?.location_id ||
            eventLocation?.id ||
            null,
        locationName:
            ev.locationName ||
            ev.location_name ||
            eventLocation?.name ||
            (typeof ev.location === "string" ? ev.location : "") ||
            sourceLocationName ||
            "",
        sourceLocationName,
        roomDetail,
        lat:
            ev.lat ??
            ev.latitude ??
            parsedCoords.lat,
        lng:
            ev.lng ??
            ev.longitude ??
            parsedCoords.lng,
        start,
        end,
    };
}
export default function Events() {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectedCategory, setSelectedCategory] = useState("");
    const [registeringId, setRegisteringId] = useState(null);
    const [unregisteringId, setUnregisteringId] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
    const [registeredEvents, setRegisteredEvents] = useState([]);

    const navigate = useNavigate();

    const eventDays = useMemo(() => {
        const s = new Set();
        for (const e of allEvents) {
            if (!e.start) continue;
            s.add(eventDateStr(e.start));
        }
        return s;
    }, [allEvents]);

    const eventCountByDay = useMemo(() => {
        const counts = {};

        for (const e of allEvents) {
            if (!e.start) continue;
            const day = eventDateStr(e.start);
            counts[day] = (counts[day] || 0) + 1;
        }

        return counts;
    }, [allEvents]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];

        return allEvents.filter((ev) => eventDateStr(ev.start) === selectedDate);
    }, [allEvents, selectedDate]);

    const categoryOptions = useMemo(() => {
        return Array.from(new Set(allEvents.map((event) => event.category).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b));
    }, [allEvents]);

    async function loadEvents(filters = {}) {
        try {
            setLoading(true);
            setError("");

            const data = await fetchEvents(filters); // expects { events: [] }
            const raw = Array.isArray(data?.events) ? data.events : [];
            const normalized = raw.map(normalizeEvent);

            const finalEvents = normalized;

            setAllEvents(finalEvents);

            // if a date filter is active, keep it applied
            if (selectedDate) {
                setEvents(finalEvents.filter((ev) => ev.start?.startsWith(selectedDate)));
            } else {
                setEvents(finalEvents);
            }
        } catch (e) {
            console.error(e);
            setError(e?.message || "Failed to load events.");
            setAllEvents([]);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadRegisteredEvents() {
        try {
            const data = await fetchRegisteredEvents();
            const raw = Array.isArray(data?.events)
                ? data.events
                : Array.isArray(data)
                    ? data
                    : [];

            const normalized = raw
                .map((item) => normalizeEvent(item.event || item))
                .filter((ev) => ev.id);

            setRegisteredEvents(normalized);
            setRegisteredEventIds(new Set(normalized.map((ev) => ev.id)));
        } catch (e) {
            console.error("Failed to load registrations:", e);
            setRegisteredEvents([]);
            setRegisteredEventIds(new Set());
        }
    }

    async function handleRegister(eventId) {
        try {
            setRegisteringId(eventId);
            setFeedback("");
            await registerForEvent(eventId);
            await loadRegisteredEvents();
            setFeedback("Registered for event successfully.");
        } catch (e) {
            console.error(e);
            setFeedback(e?.status === 404
                ? "Event not found."
                : "Register failed. Please make sure you are logged in.");
        } finally {
            setRegisteringId(null);
        }
    }

    async function handleUnregister(eventId) {
        try {
            setUnregisteringId(eventId);
            setFeedback("");
            await unregisterFromEvent(eventId);
            await loadRegisteredEvents();
            setFeedback("Unregistered from event successfully.");
        } catch (e) {
            console.error(e);
            setFeedback("Failed to unregister from event.");
        } finally {
            setUnregisteringId(null);
        }
    }

    useEffect(() => {
        loadEvents();
        loadRegisteredEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSearch = (e) => {
        e.preventDefault();

        let filtered = [...allEvents];

        if (q.trim()) {
            const query = q.trim().toLowerCase();

            filtered = filtered.filter((ev) =>
                (ev.title || "").toLowerCase().includes(query) ||
                (ev.description || "").toLowerCase().includes(query) ||
                (ev.locationName || "").toLowerCase().includes(query) ||
                (ev.sourceLocationName || "").toLowerCase().includes(query) ||
                (ev.roomDetail || "").toLowerCase().includes(query) ||
                (ev.category || "").toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter((ev) => ev.category === selectedCategory);
        }

        if (selectedDate) {
            filtered = filtered.filter((ev) => eventDateStr(ev.start) === selectedDate);
        }

        setEvents(filtered);
    };

    function handleViewOnMap(ev) {
        if (ev.locationId) {
            navigate(`/map?place=${encodeURIComponent(ev.locationId)}`);
            return;
        }

        if (ev.lat == null || ev.lng == null) {
            return;
        }

        const params = new URLSearchParams({
            lat: String(ev.lat),
            lng: String(ev.lng),
            name: ev.locationName || ev.title,
        });
        navigate(`/map?${params.toString()}`);
    }

    return (
        <div style={{ padding: "24px" }}>
            <h2>Campus Events</h2>

            <div
                style={{
                    margin: "16px 0 20px 0",
                    padding: "16px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "16px",
                    background: "#fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
            >
                {/* Calendar */}
                <div
                    style={{
                        padding: "12px",
                        border: "1px solid #e5e5e5",
                        borderRadius: "12px",
                        background: "#fafafa",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button
                            onClick={() =>
                                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                            }
                            style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                            Prev
                        </button>

                        <div style={{ fontWeight: 700 }}>{monthLabel(viewDate)}</div>

                        <button
                            onClick={() =>
                                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                            }
                            style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                            Next
                        </button>
                    </div>

                    {selectedDate && (
                        <div
                            style={{
                                marginTop: 14,
                                padding: "12px",
                                border: "1px solid #e5e5e5",
                                borderRadius: 12,
                                background: "#f9fbf9",
                            }}
                        >
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                Events on {selectedDate}
                            </div>

                            {selectedDateEvents.length === 0 ? (
                                <div style={{ fontSize: 14, color: "#666" }}>
                                    No events scheduled for this date.
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: 8 }}>
                                    {selectedDateEvents.map((ev) => (
                                        <div
                                            key={`calendar-${ev.id}`}
                                            style={{
                                                padding: "10px 12px",
                                                borderRadius: 10,
                                                background: "#fff",
                                                border: "1px solid #e5e5e5",
                                            }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{ev.title}</div>
                                            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                                                {ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}
                                                {ev.end ? ` - ${new Date(ev.end).toLocaleString()}` : ""}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: "6px",
                            marginTop: "10px",
                            fontSize: 13,
                        }}
                    >
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} style={{ fontWeight: 700, textAlign: "center", opacity: 0.75 }}>
                                {d}
                            </div>
                        ))}

                        {buildMonthGrid(viewDate).map((dateObj, idx) => {
                            if (!dateObj) return <div key={idx} />;

                            const dStr = toDateStr(dateObj);
                            const hasEvent = eventDays.has(dStr);
                            const isSelected = selectedDate === dStr;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(dStr);
                                        setEvents(allEvents.filter((ev) => eventDateStr(ev.start) === dStr));
                                    }}
                                    style={{
                                        padding: "10px 0",
                                        borderRadius: 10,
                                        border: "1px solid #ddd",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        background: isSelected
                                            ? "rgba(0, 128, 0, 0.18)"
                                            : hasEvent
                                                ? "rgba(0, 128, 0, 0.10)"
                                                : "white",
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                                        <span>{dateObj.getDate()}</span>

                                        {eventCountByDay[dStr] > 0 && (
                                            <span
                                                style={{
                                                    marginTop: 4,
                                                    fontSize: 11,
                                                    padding: "2px 6px",
                                                    borderRadius: 999,
                                                    background: "#006A31",
                                                    color: "white",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {eventCountByDay[dStr]}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                            onClick={() => {
                                setSelectedDate("");
                                setEvents(allEvents);
                            }}
                            style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                            Clear Filter
                        </button>

                        {selectedDate && (
                            <span style={{ fontSize: 13, color: "#444" }}>
                                Showing events for <strong>{selectedDate}</strong>
                            </span>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={onSearch}
                    style={{
                        marginTop: "14px",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                    }}
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search events (title, description)"
                        style={{
                            padding: "10px",
                            flex: 1,
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                        }}
                    />

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            minWidth: "160px",
                        }}
                    >
                        <option value="">All Categories</option>
                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    <button type="submit" style={{ padding: "10px 14px", borderRadius: "8px" }}>
                        Search
                    </button>
                </form>
            </div>

            {feedback && (
                <div
                    style={{
                        margin: "12px 0",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: feedback.toLowerCase().includes("failed")
                            ? "#fdecec"
                            : "#edf7ed",
                        border: feedback.toLowerCase().includes("failed")
                            ? "1px solid #f5c2c7"
                            : "1px solid #b7dfb9",
                        color: feedback.toLowerCase().includes("failed")
                            ? "#842029"
                            : "#1e4620",
                        fontSize: 14,
                    }}
                >
                    {feedback}
                </div>
            )}

            {registeredEvents.length > 0 && (
                <div
                    style={{
                        margin: "16px 0 20px 0",
                        padding: "16px",
                        border: "1px solid #e5e5e5",
                        borderRadius: "16px",
                        background: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                >
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>My Registered Events</h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                        {registeredEvents.map((ev) => (
                            <div
                                key={`registered-${ev.id}`}
                                style={{
                                    border: "1px solid #e5e5e5",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    background: "#f9fbf9",
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>{ev.title}</div>
                                <div style={{ fontSize: "14px", color: "#555", marginTop: 6 }}>
                                    {ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}
                                    {ev.end ? ` - ${new Date(ev.end).toLocaleString()}` : ""}
                                </div>
                                <div style={{ fontSize: "14px", color: "#555", marginTop: 6 }}>
                                    {formatEventLocation(ev)}
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        onClick={() => handleUnregister(ev.id)}
                                        disabled={unregisteringId === ev.id}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: unregisteringId === ev.id ? "#aaa" : "#b42318",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: unregisteringId === ev.id ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {unregisteringId === ev.id ? "Unregistering..." : "Unregister"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(q.trim() || selectedCategory || selectedDate) && (
                <div
                    style={{
                        margin: "8px 0 14px 0",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f7f7f7",
                        border: "1px solid #e5e5e5",
                        color: "#444",
                        fontSize: 14,
                    }}
                >
                    Showing <strong>{events.length}</strong> result{events.length === 1 ? "" : "s"}
                    {q.trim() && <> for <strong>"{q.trim()}"</strong></>}
                    {selectedCategory && <> in <strong>{selectedCategory}</strong></>}
                    {selectedDate && <> on <strong>{selectedDate}</strong></>}
                </div>
            )}
            <h3 style={{ margin: "20px 0 12px 0" }}>All Events</h3>

            {loading ? (
                <p>Loading events...</p>
            ) : error ? (
                <p style={{ color: "crimson" }}>{error}</p>
            ) : events.length === 0 ? (
                <p>No events found.</p>
            ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                    {events.map((ev) => {
                        const canMap = Boolean(ev.locationId) || (ev.lat != null && ev.lng != null);
                        const isRegistered = registeredEventIds.has(ev.id);

                        return (
                            <div
                                key={ev.id}
                                style={{
                                    border: "1px solid #e5e5e5",
                                    borderRadius: "16px",
                                    padding: "18px",
                                    background: "white",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: "12px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "28px", lineHeight: 1.2 }}>
                                            {ev.title}
                                        </h3>

                                        <div
                                            style={{
                                                display: "inline-block",
                                                marginTop: 10,
                                                padding: "4px 10px",
                                                borderRadius: "999px",
                                                background: "#eef6ff",
                                                color: "#1d4ed8",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                letterSpacing: "0.3px",
                                            }}
                                        >
                                            {ev.category}
                                        </div>
                                    </div>

                                </div>

                                {ev.description && (
                                    <p
                                        style={{
                                            margin: "14px 0 10px 0",
                                            color: "#444",
                                            lineHeight: 1.7,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {ev.description}
                                    </p>
                                )}

                                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                                    <div style={{ fontSize: "14px", color: "#555" }}>
                                        <strong>When:</strong>{" "}
                                        {ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}
                                        {ev.end ? ` - ${new Date(ev.end).toLocaleString()}` : ""}
                                    </div>

                                    <div style={{ fontSize: "14px", color: "#555" }}>
                                        <strong>Location:</strong>{" "}
                                        {formatEventLocation(ev)}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px", marginTop: 16, flexWrap: "wrap" }}>
                                    <button
                                        disabled={!canMap}
                                        onClick={() => handleViewOnMap(ev)}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: canMap ? "#0a5" : "#aaa",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: canMap ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        View on Map
                                    </button>

                                    <button
                                        onClick={() => (
                                            isRegistered ? handleUnregister(ev.id) : handleRegister(ev.id)
                                        )}
                                        disabled={registeringId === ev.id || unregisteringId === ev.id}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: isRegistered ? "#b42318" : "#1d4ed8",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor:
                                                registeringId === ev.id || unregisteringId === ev.id
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                registeringId === ev.id || unregisteringId === ev.id
                                                    ? 0.7
                                                    : 1,
                                        }}
                                    >
                                        {registeringId === ev.id
                                            ? "Registering..."
                                            : unregisteringId === ev.id
                                                ? "Unregistering..."
                                                : isRegistered
                                                    ? "Unregister"
                                                    : "Register"}
                                    </button>
                                </div>

                                {!canMap && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                                        Map coordinates not provided by backend.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
