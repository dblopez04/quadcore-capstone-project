import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    bookmarkEvent,
    createReminder,
    deleteReminder,
    fetchBookmarkedEvents,
    fetchEvents,
    fetchRegisteredEvents,
    fetchReminders,
    registerForEvent,
    removeBookmarkedEvent,
    unregisterFromEvent,
} from "../api/eventService";
import { fetchProfile } from "../api/userService";
import { useToast } from "../components/ToastProvider";
import { isGuestMode } from "../utils/authMode";

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

function formatTime(value) {
    if (!value) return "N/A";

    return new Date(value).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatEventDateTime(value) {
    if (!value) return "N/A";

    return new Date(value).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
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

function extractEventDescription(ev) {
    const directDescription = cleanText(ev.description);
    if (directDescription) return directDescription;

    if (typeof ev.details === "string") {
        return cleanText(ev.details);
    }

    return cleanText(
        ev.details?.description ||
        ev.details?.metadata?.description ||
        ev.details?.metadata?.summary
    );
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
        description: extractEventDescription(ev),
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
        lat: ev.lat ?? ev.latitude ?? parsedCoords.lat,
        lng: ev.lng ?? ev.longitude ?? parsedCoords.lng,
        start,
        end,
    };
}

function buildReminderTime(eventStart) {
    return new Date(new Date(eventStart).getTime() - 24 * 60 * 60 * 1000);
}

function getReminderAvailability(eventStart) {
    if (!eventStart) {
        return { enabled: false, message: "Event time is not available." };
    }

    const reminderTime = buildReminderTime(eventStart);
    if (Number.isNaN(reminderTime.getTime())) {
        return { enabled: false, message: "Event time is not available." };
    }

    if (reminderTime <= new Date()) {
        return { enabled: false, message: "Too late for a 24-hour reminder." };
    }

    return { enabled: true, message: `Reminder will send on ${reminderTime.toLocaleString()}.` };
}

function formatEventWindow(ev) {
    return `${ev.start ? new Date(ev.start).toLocaleString() : "Start: N/A"}${ev.end ? ` - ${new Date(ev.end).toLocaleString()}` : ""}`;
}

function isFeedbackError(message) {
    return /failed|fail|not found|unable|error/i.test(message);
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectedCategory, setSelectedCategory] = useState("");
    const [registeringId, setRegisteringId] = useState(null);
    const [unregisteringId, setUnregisteringId] = useState(null);
    const [bookmarkingId, setBookmarkingId] = useState(null);
    const [togglingReminderId, setTogglingReminderId] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [bookmarkedEventIds, setBookmarkedEventIds] = useState(new Set());
    const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
    const [emailRemindersByEventId, setEmailRemindersByEventId] = useState({});
    const [profileEmail, setProfileEmail] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 12;

    const eventCardRefs = useRef({});

    const navigate = useNavigate();
    const { showToast } = useToast();
    const guestMode = isGuestMode();
    const allEventsRef = useRef(null);

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

    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * eventsPerPage;
        const endIndex = startIndex + eventsPerPage;
        return events.slice(startIndex, endIndex);
    }, [events, currentPage]);

    const totalPages = Math.ceil(events.length / eventsPerPage);

    const categoryOptions = useMemo(() => {
        return Array.from(new Set(allEvents.map((event) => event.category).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b));
    }, [allEvents]);

    useEffect(() => {
        if (totalPages === 0) {
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
            return;
        }

        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    async function loadEvents(filters = {}) {
        try {
            setLoading(true);
            setError("");

            const data = await fetchEvents(filters);
            const raw = Array.isArray(data?.events) ? data.events : [];
            const normalized = raw.map(normalizeEvent);
            setAllEvents(normalized);

            if (selectedDate) {
                setEvents(normalized.filter((ev) => ev.start?.startsWith(selectedDate)));
            } else {
                setEvents(normalized);
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
        if (guestMode) {
            setRegisteredEvents([]);
            setRegisteredEventIds(new Set());
            return;
        }

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

    async function loadBookmarkedEvents() {
        if (guestMode) {
            setBookmarkedEvents([]);
            setBookmarkedEventIds(new Set());
            return;
        }

        try {
            const data = await fetchBookmarkedEvents();
            const raw = Array.isArray(data?.events)
                ? data.events
                : Array.isArray(data)
                    ? data
                    : [];

            const normalized = raw
                .map((item) => normalizeEvent(item.event || item))
                .filter((ev) => ev.id);

            setBookmarkedEvents(normalized);
            setBookmarkedEventIds(new Set(normalized.map((ev) => ev.id)));
        } catch (e) {
            console.error("Failed to load bookmarks:", e);
            setBookmarkedEvents([]);
            setBookmarkedEventIds(new Set());
        }
    }

    async function loadReminders() {
        if (guestMode) {
            setEmailRemindersByEventId({});
            return;
        }

        try {
            const data = await fetchReminders();
            const raw = Array.isArray(data?.reminders)
                ? data.reminders
                : Array.isArray(data)
                    ? data
                    : [];

            const emailReminders = raw.reduce((acc, reminder) => {
                const eventId = reminder?.event?.event_id || reminder?.event_id;
                if (!eventId || reminder.channel !== "EMAIL") {
                    return acc;
                }

                acc[eventId] = reminder;
                return acc;
            }, {});

            setEmailRemindersByEventId(emailReminders);
        } catch (e) {
            console.error("Failed to load reminders:", e);
            setEmailRemindersByEventId({});
        }
    }

    async function loadProfileEmail() {
        if (guestMode) {
            setProfileEmail("");
            return;
        }

        try {
            const data = await fetchProfile();
            setProfileEmail(data?.user?.email || "");
        } catch (e) {
            console.error("Failed to load profile email:", e);
            setProfileEmail("");
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

    async function handleBookmarkToggle(eventId) {
        if (guestMode) {
            showToast("Sign in to save events and manage reminders.", "error");
            return;
        }

        try {
            setBookmarkingId(eventId);
            setFeedback("");

            const existingReminder = emailRemindersByEventId[eventId];

            if (bookmarkedEventIds.has(eventId)) {
                if (existingReminder) {
                    await deleteReminder(existingReminder.event_reminder_id);
                }
                await removeBookmarkedEvent(eventId);
                setFeedback(existingReminder
                    ? "Saved event removed and reminder canceled."
                    : "Event removed from saved events.");
            } else {
                await bookmarkEvent(eventId);
                setFeedback("Event saved successfully.");
            }

            await Promise.all([loadBookmarkedEvents(), loadReminders()]);
        } catch (e) {
            console.error(e);
            setFeedback(e?.message || "Failed to update saved event.");
        } finally {
            setBookmarkingId(null);
        }
    }

    async function handleReminderToggle(event) {
        if (guestMode) {
            showToast("Sign in to manage email reminders.", "error");
            return;
        }

        if (!profileEmail) {
            showToast("Add an email in Settings before enabling reminders.", "error");
            return;
        }

        const availability = getReminderAvailability(event.start);
        const existingReminder = emailRemindersByEventId[event.id];

        if (!existingReminder && !availability.enabled) {
            showToast(availability.message, "error");
            return;
        }

        try {
            setTogglingReminderId(event.id);
            setFeedback("");

            if (existingReminder) {
                await deleteReminder(existingReminder.event_reminder_id);
                setFeedback("Reminder removed.");
            } else {
                await createReminder(event.id, {
                    remind_at: buildReminderTime(event.start).toISOString(),
                    channel: "EMAIL",
                });
                setFeedback("Reminder enabled.");
            }

            await loadReminders();
        } catch (e) {
            console.error(e);
            setFeedback(e?.message || "Failed to update reminder.");
        } finally {
            setTogglingReminderId(null);
        }
    }

    useEffect(() => {
        loadEvents();
        loadRegisteredEvents();
        loadBookmarkedEvents();
        loadReminders();
        loadProfileEmail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guestMode]);

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
        setCurrentPage(1);
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

    const todayStr = toDateStr(new Date());

    return (
        <div style={{ padding: "24px" }}>
            <h2>Campus Events</h2>

            {!guestMode && (
                <div
                    style={{
                        margin: "0 0 16px 0",
                        padding: "14px 16px",
                        borderRadius: 14,
                        background: "#f4fbf6",
                        border: "1px solid #cfe5d4",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Reminder email</div>
                    <div style={{ color: "#35594a", fontSize: 14 }}>
                        {profileEmail || "No email set yet."}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#56725f" }}>
                        Used for registration confirmations and 24-hour event reminders.
                    </div>
                    {!profileEmail && (
                        <button
                            onClick={() => navigate("/settings")}
                            style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8 }}
                        >
                            Add email in Settings
                        </button>
                    )}
                </div>
            )}

            <div
                style={{
                    margin: "16px 0 20px 0",
                }}
            >
                <div
                    style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
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

                    {selectedDate && (
                        <div
                            style={{
                                marginTop: 18,
                                paddingTop: "12px",
                                borderTop: "1px solid var(--border)",
                            }}
                        >
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                Events on{" "}
                                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </div>

                            {selectedDateEvents.length === 0 ? (
                                <div style={{ fontSize: 14, color: "var(--muted)" }}>
                                    No events scheduled for this date.
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: 8 }}>
                                    {selectedDateEvents.map((ev) => (
                                        <div
                                            key={`calendar-${ev.id}`}
                                            onClick={() => {
                                                setEvents(allEvents.filter((eventItem) => eventDateStr(eventItem.start) === selectedDate));
                                                setCurrentPage(1);
                                                allEventsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                            }}
                                            style={{
                                                padding: "10px 12px",
                                                borderRadius: 10,
                                                background: "var(--surface)",
                                                border: "1px solid var(--border)",
                                                cursor: "pointer",
                                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                            }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{ev.title}</div>
                                            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                                                {formatTime(ev.start)}
                                                {ev.end ? ` - ${formatTime(ev.end)}` : ""}
                                            </div>
                                            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                                                {formatEventLocation(ev)}
                                            </div>
                                            {ev.description && (
                                                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
                                                    {ev.description.length > 120
                                                        ? `${ev.description.slice(0, 120)}...`
                                                        : ev.description}
                                                </div>
                                            )}
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
                            <div key={d} style={{ fontWeight: 700, textAlign: "center", color: "var(--muted)" }}>
                                {d}
                            </div>
                        ))}

                        {buildMonthGrid(viewDate).map((dateObj, idx) => {
                            if (!dateObj) return <div key={idx} />;

                            const dStr = toDateStr(dateObj);
                            const hasEvent = eventDays.has(dStr);
                            const isSelected = selectedDate === dStr;
                            const isToday = dStr === todayStr;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(dStr);
                                        setEvents(allEvents.filter((ev) => eventDateStr(ev.start) === dStr));
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: "10px 0",
                                        borderRadius: 10,
                                        border: isSelected
                                            ? "2px solid var(--unt-green)"
                                            : isToday
                                                ? "2px solid #1d4ed8"
                                                : "1px solid var(--border)",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        color: "var(--text)",
                                        background: isSelected
                                            ? "var(--unt-green-50)"
                                            : isToday
                                                ? "rgba(29, 78, 216, 0.12)"
                                                : hasEvent
                                                    ? "var(--surface)"
                                                    : "var(--surface)",
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
                                setCurrentPage(1);
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
                            border: "1px solid var(--input-border)",
                            background: "var(--input-bg)",
                            color: "var(--input-text)",
                        }}
                    />

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid var(--input-border)",
                            background: "var(--input-bg)",
                            color: "var(--input-text)",
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
                    <button
                        type="submit"
                        style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: "var(--unt-green)",
                            color: "#fff",
                            border: "none",
                            fontWeight: 600,
                        }}
                    >
                        Search
                    </button>
                </form>

                {feedback && (
                    <div
                        style={{
                            margin: "12px 0",
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: isFeedbackError(feedback)
                                ? "rgba(220, 38, 38, 0.10)"
                                : "var(--unt-green-50)",
                            border: isFeedbackError(feedback)
                                ? "1px solid rgba(220, 38, 38, 0.35)"
                                : "1px solid var(--border)",
                            color: isFeedbackError(feedback)
                                ? "#dc2626"
                                : "var(--unt-green)",
                            fontSize: 14,
                        }}
                    >
                        {feedback}
                    </div>
                )}
            </div>

            {!guestMode && (
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
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>My Saved Events</h3>
                    {bookmarkedEvents.length === 0 ? (
                        <div style={{ fontSize: 14, color: "#666" }}>
                            Save an event to turn on a 24-hour email reminder.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "12px" }}>
                            {bookmarkedEvents.map((ev) => {
                                const reminder = emailRemindersByEventId[ev.id];
                                const availability = getReminderAvailability(ev.start);
                                const isTooLate = !availability.enabled && !reminder;

                                return (
                                    <div
                                        key={`saved-${ev.id}`}
                                        style={{
                                            border: "1px solid #e5e5e5",
                                            borderRadius: "12px",
                                            padding: "14px",
                                            background: "#f9fbf9",
                                        }}
                                    >
                                        <div style={{ fontWeight: 700 }}>{ev.title}</div>
                                        <div style={{ fontSize: "14px", color: "#555", marginTop: 6 }}>
                                            {formatEventWindow(ev)}
                                        </div>
                                        <div style={{ fontSize: "14px", color: "#555", marginTop: 6 }}>
                                            {formatEventLocation(ev)}
                                        </div>
                                        <div style={{ marginTop: 10, fontSize: 13, color: reminder ? "#1e4620" : "#666" }}>
                                            {reminder ? `Email reminder on. ${new Date(reminder.remind_at).toLocaleString()}` : availability.message}
                                        </div>
                                        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                                            <button
                                                onClick={() => handleBookmarkToggle(ev.id)}
                                                disabled={bookmarkingId === ev.id}
                                                style={{ padding: "10px 14px", borderRadius: 10 }}
                                            >
                                                {bookmarkingId === ev.id ? "Saving..." : "Unsave"}
                                            </button>
                                            <button
                                                onClick={() => handleReminderToggle(ev)}
                                                disabled={togglingReminderId === ev.id || isTooLate || !profileEmail}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: 10,
                                                    background: reminder ? "#b42318" : "#1d4ed8",
                                                    color: "white",
                                                    border: "none",
                                                    fontWeight: 600,
                                                    cursor: (togglingReminderId === ev.id || isTooLate || !profileEmail) ? "not-allowed" : "pointer",
                                                    opacity: (togglingReminderId === ev.id || isTooLate || !profileEmail) ? 0.7 : 1,
                                                }}
                                            >
                                                {togglingReminderId === ev.id ? "Updating..." : reminder ? "Remove Reminder" : "Email Reminder"}
                                            </button>
                                        </div>
                                        {!profileEmail && (
                                            <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                                                Add an email in Settings before enabling reminders.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {registeredEvents.length > 0 && (
                <div
                    style={{
                        margin: "16px 0 20px 0",
                        padding: "16px",
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        background: "var(--surface)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                >
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>My Registered Events</h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                        {registeredEvents.map((ev) => (
                            <div
                                key={`registered-${ev.id}`}
                                onClick={() => {
                                    const matchingIndex = events.findIndex((eventItem) => eventItem.id === ev.id);

                                    if (matchingIndex !== -1) {
                                        const pageForEvent = Math.floor(matchingIndex / eventsPerPage) + 1;
                                        setCurrentPage(pageForEvent);

                                        setTimeout(() => {
                                            eventCardRefs.current[ev.id]?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "center",
                                            });
                                        }, 100);
                                    } else {
                                        allEventsRef.current?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        });
                                    }
                                }}
                                style={{
                                    border: "1px solid var(--border)",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    background: "var(--surface)",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>{ev.title}</div>
                                <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: 6 }}>
                                    {ev.start ? formatTime(ev.start) : "Start: N/A"}
                                    {ev.end ? ` - ${formatTime(ev.end)}` : ""}
                                </div>
                                <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: 6 }}>
                                    {formatEventLocation(ev)}
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: 12, flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => handleViewOnMap(ev)}
                                        disabled={!(ev.locationId || (ev.lat != null && ev.lng != null))}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: ev.locationId || (ev.lat != null && ev.lng != null) ? "#0a5" : "#aaa",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: ev.locationId || (ev.lat != null && ev.lng != null) ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        View on Map
                                    </button>

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
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: 14,
                    }}
                >
                    Showing <strong>{events.length}</strong> result{events.length === 1 ? "" : "s"}
                    {q.trim() && <> for <strong>"{q.trim()}"</strong></>}
                    {selectedCategory && <> in <strong>{selectedCategory}</strong></>}
                    {selectedDate && <> on <strong>{selectedDate}</strong></>}
                </div>
            )}
            <h3 ref={allEventsRef} style={{ margin: "20px 0 12px 0" }}>
                All Events
            </h3>

            {loading ? (
                <p>Loading events...</p>
            ) : error ? (
                <p style={{ color: "crimson" }}>{error}</p>
            ) : events.length === 0 ? (
                <p>No events found.</p>
            ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                    {paginatedEvents.map((ev) => {
                        const canMap = Boolean(ev.locationId) || (ev.lat != null && ev.lng != null);
                        const isRegistered = registeredEventIds.has(ev.id);
                        const isBookmarked = bookmarkedEventIds.has(ev.id);
                        const reminder = emailRemindersByEventId[ev.id];
                        const availability = getReminderAvailability(ev.start);

                        return (
                            <div
                                key={ev.id}
                                ref={(el) => {
                                    if (el) eventCardRefs.current[ev.id] = el;
                                }}
                                style={{
                                    border: "1px solid var(--border)",
                                    borderRadius: "16px",
                                    padding: "18px",
                                    background: "var(--surface)",
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
                                        <h3 style={{ margin: 0, fontSize: "28px", lineHeight: 1.2, color: "var(--text)" }}>
                                            {ev.title}
                                        </h3>

                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                            <div
                                                style={{
                                                    display: "inline-block",
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    background: "var(--unt-green-50)",
                                                    color: "var(--unt-green)",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.3px",
                                                }}
                                            >
                                                {ev.category}
                                            </div>
                                            {isBookmarked && (
                                                <div
                                                    style={{
                                                    display: "inline-block",
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    background: "var(--surface)",
                                                    color: "var(--unt-green)",
                                                    border: "1px solid var(--border)",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.3px",
                                                }}
                                                >
                                                    Saved
                                                </div>
                                            )}
                                            {reminder && (
                                                <div
                                                    style={{
                                                    display: "inline-block",
                                                    padding: "4px 10px",
                                                    borderRadius: "999px",
                                                    background: "rgba(29, 78, 216, 0.12)",
                                                    color: "#1d4ed8",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.3px",
                                                }}
                                                >
                                                    Email reminder on
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {ev.description && (
                                    <p
                                        style={{
                                            margin: "14px 0 10px 0",
                                            color: "var(--text)",
                                            lineHeight: 1.7,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {ev.description}
                                    </p>
                                )}

                                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                                    <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                                        <strong>When:</strong>{" "}
                                        {ev.start ? formatEventDateTime(ev.start) : "Start: N/A"}
                                        {ev.end ? ` - ${formatTime(ev.end)}` : ""}
                                    </div>

                                    <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                                        <strong>Location:</strong>{" "}
                                        {formatEventLocation(ev)}
                                    </div>

                                    {isBookmarked && (
                                        <div style={{ fontSize: "13px", color: reminder ? "#1e4620" : "#666" }}>
                                            {reminder ? `Email reminder on. ${new Date(reminder.remind_at).toLocaleString()}` : availability.message}
                                        </div>
                                    )}
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
                                        onClick={() => (isRegistered ? handleUnregister(ev.id) : handleRegister(ev.id))}
                                        disabled={registeringId === ev.id || unregisteringId === ev.id}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: isRegistered ? "#b42318" : "#1d4ed8",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: registeringId === ev.id || unregisteringId === ev.id ? "not-allowed" : "pointer",
                                            opacity: registeringId === ev.id || unregisteringId === ev.id ? 0.7 : 1,
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

                                    <button
                                        onClick={() => handleBookmarkToggle(ev.id)}
                                        disabled={bookmarkingId === ev.id || guestMode}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: isBookmarked ? "#475467" : "#006A31",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: bookmarkingId === ev.id || guestMode ? "not-allowed" : "pointer",
                                            opacity: bookmarkingId === ev.id || guestMode ? 0.7 : 1,
                                        }}
                                    >
                                        {bookmarkingId === ev.id ? "Updating..." : isBookmarked ? "Unsave" : "Save Event"}
                                    </button>

                                    {isBookmarked && (
                                        <button
                                            onClick={() => handleReminderToggle(ev)}
                                            disabled={togglingReminderId === ev.id || !profileEmail || (!availability.enabled && !reminder)}
                                            style={{
                                                padding: "10px 14px",
                                                borderRadius: 10,
                                                background: reminder ? "#b42318" : "#7c3aed",
                                                color: "white",
                                                border: "none",
                                                fontWeight: 600,
                                                cursor: togglingReminderId === ev.id || !profileEmail || (!availability.enabled && !reminder) ? "not-allowed" : "pointer",
                                                opacity: togglingReminderId === ev.id || !profileEmail || (!availability.enabled && !reminder) ? 0.7 : 1,
                                            }}
                                        >
                                            {togglingReminderId === ev.id ? "Updating..." : reminder ? "Remove Reminder" : "Email Reminder"}
                                        </button>
                                    )}
                                </div>

                                {!isBookmarked && !guestMode && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                                        Save this event to enable a 24-hour email reminder.
                                    </div>
                                )}

                                {isBookmarked && !profileEmail && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                                        Add an email in Settings before enabling reminders.
                                    </div>
                                )}

                                {isBookmarked && !emailRemindersByEventId[ev.id] && !availability.enabled && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                                        Too late for a 24-hour reminder.
                                    </div>
                                )}

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
            {totalPages > 1 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            background: currentPage === 1 ? "#f3f3f3" : "white",
                            cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        }}
                    >
                        Prev
                    </button>

                    <span style={{ fontSize: "14px", color: "#444" }}>
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            background: currentPage === totalPages ? "#f3f3f3" : "white",
                            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
