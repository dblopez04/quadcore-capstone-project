import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEvents, registerForEvent } from "../api/eventService";

function pad2(n) {
    return String(n).padStart(2, "0");
}

function toDateStr(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

    const start = startRaw ? new Date(startRaw).toISOString() : null;
    const end = endRaw ? new Date(endRaw).toISOString() : null;

    return {
        id: ev.event_id || ev.id || ev._id,
        title: ev.title || ev.name || "Untitled Event",
        description: ev.description || ev.details || "",
        category: ev.category || ev.event_type || ev.type || "Event",
        locationName:
            ev.locationName ||
            ev.location_name ||
            ev.location?.name ||
            ev.location ||
            "",
        lat:
            ev.lat ??
            ev.latitude ??
            ev.location?.lat ??
            ev.location?.latitude ??
            null,
        lng:
            ev.lng ??
            ev.longitude ??
            ev.location?.lng ??
            ev.location?.longitude ??
            null,
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

    const navigate = useNavigate();

    const eventDays = useMemo(() => {
        const s = new Set();
        for (const e of allEvents) {
            if (!e.start) continue;
            s.add(e.start.slice(0, 10)); // "YYYY-MM-DD"
        }
        return s;
    }, [allEvents]);

    async function loadEvents(filters = {}) {
        try {
            setLoading(true);
            setError("");

            const data = await fetchEvents(filters); // expects { events: [] }
            const raw = Array.isArray(data?.events) ? data.events : [];
            const normalized = raw.map(normalizeEvent);

            const demo = [
                {
                    id: "demo-1",
                    title: "UNT Career Fair",
                    description: "Meet employers and bring your resume.",
                    category: "Career",
                    locationName: "Union Ballroom",
                    lat: 33.2090,
                    lng: -97.1490,
                    start: new Date().toISOString(),
                    end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    isDemo: true,
                },
                {
                    id: "demo-2",
                    title: "Study Jam: CSCE Review",
                    description: "Group study session for upcoming exam.",
                    category: "Academic",
                    locationName: "Willis Library",
                    lat: 33.2106,
                    lng: -97.1503,
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                    isDemo: true,
                },
            ];

            // If backend returns no events, show demo events so UI is not empty for sprint demo
            const finalEvents = normalized.length === 0 ? demo : normalized;

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

    async function handleRegister(eventId) {
        try {
            await registerForEvent(eventId);
            alert("Registered for event!");
            // Optional refresh so the UI stays in sync later
            // await loadEvents({ q });
        } catch (e) {
            console.error(e);

            // If backend returns useful codes, you can show nicer messages
            const msg =
                e?.status === 409
                    ? "This event is full."
                    : e?.status === 404
                        ? "Event not found."
                        : "Register failed (are you logged in?).";

            alert(msg);
        }
    }
    useEffect(() => {
        loadEvents(); // GET /api/events
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSearch = async (e) => {
        e.preventDefault();
        setSelectedDate(""); // clear date filter when searching
        await loadEvents({ q });
    };

    return (
        <div style={{ padding: "24px" }}>
            <h2>Campus Events</h2>

            {/* Calendar */}
            <div
                style={{
                    margin: "16px 0",
                    padding: "12px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "12px",
                    background: "#fff",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        style={{ padding: "6px 10px", borderRadius: 8 }}
                    >
                        Prev
                    </button>

                    <div style={{ fontWeight: 700 }}>{monthLabel(viewDate)}</div>

                    <button
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        style={{ padding: "6px 10px", borderRadius: 8 }}
                    >
                        Next
                    </button>
                </div>

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
                                onClick={async () => {
                                    setSelectedDate(dStr);
                                    await loadEvents({ start: dStr, end: dStr, q });
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
                                {dateObj.getDate()}
                            </button>
                        );
                    })}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                        onClick={async () => {
                            setSelectedDate("");
                            await loadEvents(q ? { q } : {});
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

            <form onSubmit={onSearch} style={{ margin: "12px 0", display: "flex", gap: "8px" }}>
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
                <button type="submit" style={{ padding: "10px 14px", borderRadius: "8px" }}>
                    Search
                </button>
            </form>

            {events.length > 0 && events.every((ev) => ev.isDemo) && (
                <div
                    style={{
                        margin: "12px 0",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "#fff8e1",
                        border: "1px solid #f0d98c",
                        color: "#6b5b00",
                        fontSize: "14px",
                    }}
                >
                    Showing demo events because no real events are currently available from the backend.
                </div>
            )}
            {loading ? (
                <p>Loading events...</p>
            ) : error ? (
                <p style={{ color: "crimson" }}>{error}</p>
            ) : events.length === 0 ? (
                <p>No events found.</p>
            ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                    {events.map((ev) => {
                        const canMap = ev.lat != null && ev.lng != null;

                        return (
                            <div
                                key={ev.id}
                                style={{
                                    border: "1px solid #e5e5e5",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    background: "white",
                                }}
                            >
                                
                                <h3 style={{ margin: 0 }}>{ev.title}</h3>

                                {ev.isDemo && (
                                    <div
                                        style={{
                                            display: "inline-block",
                                            marginTop: 6,
                                            padding: "2px 8px",
                                            borderRadius: 999,
                                            fontSize: 12,
                                            border: "1px solid #ddd",
                                            background: "#f7f7f7",
                                            color: "#444",
                                        }}
                                    >
                                        Demo Data
                                    </div>
                                )}

                                <p style={{ margin: "6px 0" }}>
                                    <strong>{ev.category}</strong>
                                    {ev.locationName ? ` - ${ev.locationName}` : ""}
                                </p>

                                {ev.description && <p style={{ margin: "6px 0", color: "#444" }}>{ev.description}</p>}

                                <p style={{ margin: "6px 0", fontSize: "14px", color: "#666" }}>
                                    {ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}
                                    {ev.end ? ` - ${new Date(ev.end).toLocaleString()}` : ""}
                                </p>


                                {/* REGISTER BUTTON */}
                                <button
                                    onClick={() => handleRegister(ev.id)}
                                    disabled={ev.isDemo}
                                    style={{
                                        marginTop: 10,
                                        marginRight: 10,
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        background: ev.isDemo ? "#aaa" : "#0b5",
                                        color: "white",
                                        border: "none",
                                        cursor: ev.isDemo ? "not-allowed" : "pointer",
                                    }}
                                >
                                    Register
                                </button>

                                {/* VIEW ON MAP BUTTON */}
                                <button
                                    disabled={!canMap}
                                    onClick={() => {
                                        const params = new URLSearchParams({
                                            lat: String(ev.lat),
                                            lng: String(ev.lng),
                                            name: ev.title,
                                        });
                                        navigate(`/map?${params.toString()}`);
                                    }}
                                    style={{
                                        marginTop: 10,
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        background: canMap ? "#0a5" : "#aaa",
                                        color: "white",
                                        border: "none",
                                        cursor: canMap ? "pointer" : "not-allowed",
                                    }}
                                >
                                    View on Map
                                </button>
                                

                                {!canMap && (
                                    <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}>
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