import { useEffect, useState } from "react";
import { getEvents, searchEvents } from "../api/eventService";

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

export default function Events() {
    const [events, setEvents] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [allEvents, setAllEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
    const [viewDate, setViewDate] = useState(() => new Date());

    const eventDays = new Set(
        allEvents.map((e) => e.start.slice(0, 10)) // "YYYY-MM-DD"
    );

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getEvents();
            setEvents(data);
            setLoading(false);
        })();
    }, []);

    const onSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = await searchEvents(q);
        setAllEvents(data);
        setEvents(data);
        setLoading(false);
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
                                onClick={() => {
                                    setSelectedDate(dStr);
                                    const next = allEvents.filter((ev) => ev.start.startsWith(dStr));
                                    setEvents(next);
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
                style={{ margin: "12px 0", display: "flex", gap: "8px" }}
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search events (title, category, location)"
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

            {loading ? (
                <p>Loading events...</p>
            ) : events.length === 0 ? (
                <p>No events found.</p>
            ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                    {events.map((ev) => (
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
                            <p style={{ margin: "6px 0" }}>
                                <strong>{ev.category}</strong> • {ev.locationName}
                            </p>
                            <p style={{ margin: "6px 0", color: "#444" }}>{ev.description}</p>
                            <p style={{ margin: "6px 0", fontSize: "14px", color: "#666" }}>
                                {new Date(ev.start).toLocaleString()} – {new Date(ev.end).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
