import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    bookmarkEvent,
    createReminder,
    deleteReminder,
    fetchBookmarkedEvents,
    fetchEvents,
    fetchReminders,
    registerForEvent,
    removeBookmarkedEvent,
} from "../api/eventService";
import { fetchProfile } from "../api/userService";
import { isGuestMode } from "../utils/authMode";
import { useToast } from "../components/ToastProvider";

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

    const startDay = first.getDay();
    const daysInMonth = last.getDate();

    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
}

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
        isDemo: Boolean(ev.isDemo),
    };
}

function buildDemoEvents() {
    return [
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
            start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
            isDemo: true,
        },
    ];
}

function getReminderCutoff(start) {
    return new Date(new Date(start).getTime() - 24 * 60 * 60 * 1000);
}

function formatEventWindow(event) {
    const startText = event.start ? new Date(event.start).toLocaleString() : "Start: N/A";
    const endText = event.end ? new Date(event.end).toLocaleString() : "";
    return endText ? `${startText} - ${endText}` : startText;
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [savedEvents, setSavedEvents] = useState([]);
    const [profileEmail, setProfileEmail] = useState("");
    const [emailReminders, setEmailReminders] = useState({});
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [savedLoading, setSavedLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [viewDate, setViewDate] = useState(() => new Date());
    const [activeEventId, setActiveEventId] = useState("");

    const navigate = useNavigate();
    const { showToast } = useToast();
    const guestMode = isGuestMode();

    const eventDays = useMemo(() => {
        const s = new Set();
        for (const e of allEvents) {
            if (!e.start) continue;
            s.add(e.start.slice(0, 10));
        }
        return s;
    }, [allEvents]);

    const savedEventIds = useMemo(() => {
        return new Set(savedEvents.map((event) => event.id));
    }, [savedEvents]);

    async function loadEvents(filters = {}, nextSelectedDate = selectedDate) {
        try {
            setLoading(true);
            setError("");

            const data = await fetchEvents(filters);
            const raw = Array.isArray(data?.events) ? data.events : [];
            const normalized = raw.map(normalizeEvent);
            const finalEvents = normalized.length === 0 ? buildDemoEvents() : normalized;

            setAllEvents(finalEvents);
            setEvents(nextSelectedDate
                ? finalEvents.filter((event) => event.start?.startsWith(nextSelectedDate))
                : finalEvents);
        } catch (e) {
            console.error(e);
            setError(e?.message || "Failed to load events.");
            setAllEvents([]);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadSavedContext() {
        if (guestMode) {
            setSavedEvents([]);
            setProfileEmail("");
            setEmailReminders({});
            return;
        }

        try {
            setSavedLoading(true);
            const [profileData, bookmarkData, reminderData] = await Promise.all([
                fetchProfile(),
                fetchBookmarkedEvents(),
                fetchReminders(),
            ]);

            const bookmarkEvents = Array.isArray(bookmarkData?.events)
                ? bookmarkData.events.map(normalizeEvent)
                : [];

            const reminders = Array.isArray(reminderData?.reminders) ? reminderData.reminders : [];
            const emailReminderMap = reminders.reduce((acc, reminder) => {
                if (reminder.channel === "EMAIL" && reminder.event?.event_id) {
                    acc[reminder.event.event_id] = reminder;
                }
                return acc;
            }, {});

            setSavedEvents(bookmarkEvents);
            setEmailReminders(emailReminderMap);
            setProfileEmail(profileData?.user?.email || "");
        } catch (e) {
            console.error("Failed to load saved event data:", e);
            setSavedEvents([]);
            setEmailReminders({});
            setProfileEmail("");
        } finally {
            setSavedLoading(false);
        }
    }

    useEffect(() => {
        loadEvents();
        loadSavedContext();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guestMode]);

    async function handleRegister(eventId) {
        try {
            await registerForEvent(eventId);
            showToast("Registered for event.", "success");
        } catch (e) {
            console.error(e);

            const msg =
                e?.status === 409
                    ? "This event is full."
                    : e?.status === 404
                        ? "Event not found."
                        : "Register failed (are you logged in?).";

            showToast(msg, "error");
        }
    }

    async function handleBookmarkToggle(event) {
        if (guestMode) {
            showToast("Sign in to save events and manage reminders.", "error");
            return;
        }

        if (event.isDemo) {
            showToast("Demo events cannot be saved.", "error");
            return;
        }

        setActiveEventId(event.id);

        try {
            if (savedEventIds.has(event.id)) {
                await removeBookmarkedEvent(event.id);
                showToast("Removed from saved events.", "success");
            } else {
                await bookmarkEvent(event.id);
                showToast("Event saved.", "success");
            }

            await loadSavedContext();
        } catch (e) {
            console.error(e);
            showToast(e?.message || "Unable to update saved events.", "error");
        } finally {
            setActiveEventId("");
        }
    }

    async function handleEmailReminderToggle(event) {
        if (guestMode) {
            showToast("Sign in to manage email reminders.", "error");
            return;
        }

        const existingReminder = emailReminders[event.id];
        const cutoff = getReminderCutoff(event.start);

        if (!existingReminder && cutoff <= new Date()) {
            showToast("This event starts too soon for a 24-hour reminder.", "error");
            return;
        }

        setActiveEventId(event.id);

        try {
            if (existingReminder) {
                await deleteReminder(existingReminder.event_reminder_id);
                showToast("Email reminder removed.", "success");
            } else {
                await createReminder(event.id, { channel: "EMAIL" });
                showToast("You'll get an email 24 hours before this event starts.", "success");
            }

            await loadSavedContext();
        } catch (e) {
            console.error(e);
            showToast(e?.message || "Unable to update email reminder.", "error");
        } finally {
            setActiveEventId("");
        }
    }

    const onSearch = async (e) => {
        e.preventDefault();
        setSelectedDate("");
        await loadEvents({ q }, "");
    };

    return (
        <div style={{ padding: "24px" }}>
            <h2>Campus Events</h2>

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
                                    await loadEvents({ start: dStr, end: dStr, q }, dStr);
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
                            await loadEvents(q ? { q } : {}, "");
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

            {!guestMode && (
                <div
                    style={{
                        margin: "0 0 16px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#f5fbf7",
                        border: "1px solid #d6eadc",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Reminder email</div>
                    <div style={{ color: "#35594a", fontSize: 14 }}>
                        {profileEmail ? profileEmail : "No email on file."}
                    </div>
                    <button
                        onClick={() => navigate("/settings")}
                        style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8 }}
                    >
                        Update email in Settings
                    </button>
                </div>
            )}

            <div
                style={{
                    marginBottom: "18px",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid #d9e3dd",
                    background: "#ffffff",
                }}
            >
                <h3 style={{ marginTop: 0 }}>Saved Events</h3>
                <p style={{ marginTop: 0, color: "#53645b", fontSize: 14 }}>
                    Save an event, then opt in to one email reminder sent 24 hours before it starts.
                </p>

                {guestMode ? (
                    <p style={{ marginBottom: 0, color: "#53645b" }}>
                        Sign in to save events and turn on reminder emails.
                    </p>
                ) : savedLoading ? (
                    <p style={{ marginBottom: 0, color: "#53645b" }}>Loading saved events...</p>
                ) : savedEvents.length === 0 ? (
                    <p style={{ marginBottom: 0, color: "#53645b" }}>No saved events yet.</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {savedEvents.map((event) => {
                            const reminder = emailReminders[event.id];
                            const reminderCutoff = event.start ? getReminderCutoff(event.start) : null;
                            const canEnableReminder = reminderCutoff && reminderCutoff > new Date();

                            return (
                                <div
                                    key={`saved-${event.id}`}
                                    style={{
                                        border: "1px solid #e5e5e5",
                                        borderRadius: "12px",
                                        padding: "14px",
                                        background: "#fbfdfb",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <div>
                                            <h4 style={{ margin: "0 0 6px" }}>{event.title}</h4>
                                            <div style={{ color: "#53645b", fontSize: 14 }}>{formatEventWindow(event)}</div>
                                            {event.locationName && (
                                                <div style={{ color: "#53645b", fontSize: 14 }}>{event.locationName}</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleBookmarkToggle(event)}
                                            disabled={activeEventId === event.id}
                                            style={{ padding: "8px 10px", borderRadius: 8 }}
                                        >
                                            Unsave
                                        </button>
                                    </div>

                                    <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(reminder)}
                                            disabled={activeEventId === event.id || (!reminder && !canEnableReminder)}
                                            onChange={() => handleEmailReminderToggle(event)}
                                        />
                                        <span>Email me 24 hours before this event</span>
                                    </label>

                                    <div style={{ marginTop: 8, fontSize: 13, color: "#53645b" }}>
                                        {reminder
                                            ? `Reminder scheduled for ${new Date(reminder.remind_at).toLocaleString()}`
                                            : canEnableReminder
                                                ? "No email reminder scheduled yet."
                                                : "This event starts in less than 24 hours, so a 24-hour reminder can no longer be scheduled."}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
                        const isSaved = savedEventIds.has(ev.id);

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
                                    {formatEventWindow(ev)}
                                </p>

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

                                <button
                                    onClick={() => handleBookmarkToggle(ev)}
                                    disabled={activeEventId === ev.id || ev.isDemo}
                                    style={{
                                        marginTop: 10,
                                        marginRight: 10,
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        background: isSaved ? "#245c3f" : "#1f7a4b",
                                        color: "white",
                                        border: "none",
                                        cursor: ev.isDemo ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {isSaved ? "Saved" : "Save Event"}
                                </button>

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
