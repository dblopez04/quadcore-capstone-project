import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchRegisteredEvents } from "../api/eventService";

const primaryBtn = {
    padding: "0.9rem 1.3rem",
    borderRadius: "12px",
    border: "none",
    background: "#006633",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0, 102, 51, 0.3)",
};

const secondaryBtn = {
    padding: "0.8rem 1.1rem",
    borderRadius: "10px",
    border: "1px solid #cfd8d3",
    background: "white",
    color: "#134",
    fontWeight: 600,
    cursor: "pointer",
};

const actionCard = {
    padding: "1.25rem",
    background: "white",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    cursor: "pointer",

    transform: "translateY(0px)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const actionTitle = {
    fontSize: "1.05rem",
    fontWeight: 700,
    marginBottom: "0.35rem",
};

const actionSub = {
    fontSize: "0.95rem",
    color: "#556",
};

const sectionHeaderRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
};

const viewAllBtn = {
    background: "none",
    border: "none",
    color: "#006633",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.95rem",
};

const eventCard = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 22px",
    borderRadius: 18,
    border: "1px solid #e4e7ec",
    background: "#fff",
    boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    marginBottom: 14,
};

const eventTitle = {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#101828",
    margin: 0,
};

function cleanText(value) {
    if (value == null) return "";
    return String(value).trim();
}

function formatRegisteredEventDate(value) {
    if (!value) return "Date TBD";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Date TBD";

    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatRegisteredEventLocation(ev) {
    const locationName =
        cleanText(ev.locationName) ||
        cleanText(ev.location_name) ||
        cleanText(ev.location?.name) ||
        cleanText(typeof ev.location === "string" ? ev.location : "");

    const sourceLocationName =
        cleanText(ev.details?.source_location_name) ||
        cleanText(ev.source_location_name);

    const roomDetail =
        cleanText(ev.details?.room_detail) ||
        cleanText(ev.room_detail);

    const baseLocation = locationName || sourceLocationName;

    if (!roomDetail) {
        return baseLocation || "Location not provided";
    }

    if (baseLocation && baseLocation.toLowerCase().includes(roomDetail.toLowerCase())) {
        return baseLocation;
    }

    return baseLocation ? `${baseLocation}, ${roomDetail}` : roomDetail;
}

function normalizeRegisteredEvent(item) {
    const ev = item.event || item;

    return {
        id: ev.event_id || ev.id || ev._id,
        title: ev.title || ev.name || "Untitled Event",
        date: formatRegisteredEventDate(
            ev.start_date_time ||
            ev.start_time ||
            ev.startTime ||
            ev.start ||
            ev.start_date ||
            ev.startDate
        ),
        location: formatRegisteredEventLocation(ev),
    };
}

export default function Home() {
    const navigate = useNavigate();

    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [loadingRegisteredEvents, setLoadingRegisteredEvents] = useState(true);

    useEffect(() => {
        const loadRegisteredEvents = async () => {
            try {
                const data = await fetchRegisteredEvents();

                const raw = Array.isArray(data?.events)
                    ? data.events
                    : Array.isArray(data)
                        ? data
                        : [];

                const normalized = raw
                    .map((item) => normalizeRegisteredEvent(item))
                    .filter((ev) => ev.id);

                setRegisteredEvents(normalized);
            } catch (error) {
                console.error("Error loading registered events:", error);
                setRegisteredEvents([]);
            } finally {
                setLoadingRegisteredEvents(false);
            }
        };

        loadRegisteredEvents();
    }, []);

    return (
        <section style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto 3rem" }}>
            {/* HERO SECTION */}
            <div style={{ marginBottom: "3rem" }}>
                <h1
                    style={{
                        fontSize: "2.5rem",
                        marginBottom: "0.5rem",
                        color: "#006633", 
                        fontWeight: 800,
                    }}
                >
                    Getting Around UNT
                </h1>
                <p style={{ fontSize: "1.1rem", color: "#555" }}>
                    Find buildings, events, routes, and more 😊 all in one place.
                </p>

                <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button style={primaryBtn} onClick={() => navigate("/map")}>
                        Open Map
                    </button>

                    <button style={secondaryBtn} onClick={() => navigate("/map")}>
                        Use My Location
                    </button>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div
                style={{
                    marginBottom: "2.5rem",
                    padding: "2rem",
                    background: "white",
                    borderRadius: "18px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                }}
            >
                <h2 style={{ marginBottom: "1rem" }}>Quick Actions</h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    <div
                        style={actionCard}
                        onClick={() => navigate("/search")}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-6px)";
                            e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
                        }}
                    >
                        <div style={actionTitle}>Search Places</div>
                        <div style={actionSub}>Look up buildings and campus spots</div>
                    </div>

                    <div
                        style={actionCard}
                        onClick={() => navigate("/map")}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-6px)";
                            e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
                        }}
                    >
                        <div style={actionTitle}>Find Route</div>
                        <div style={actionSub}>Get directions across campus</div>
                    </div>

                    <div
                        style={actionCard}
                        onClick={() => navigate("/events")}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-6px)";
                            e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
                        }}
                    >
                        <div style={actionTitle}>Today's Events</div>
                        <div style={actionSub}>See what's happening today</div>
                    </div>

                    <div
                        style={actionCard}
                        onClick={() => navigate("/bookmarks")}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-6px)";
                            e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
                        }}
                    >
                        <div style={actionTitle}>My Bookmarks</div>
                        <div style={actionSub}>Your saved places and events</div>
                    </div>   
                </div>
            </div>

            {/* REGISTERED EVENTS PREVIEW */}
            <div>
                <div style={sectionHeaderRow}>
                    <h2>My Registered Events</h2>

                    <button
                        onClick={() => navigate("/events")}
                        style={viewAllBtn}
                    >
                        View All
                    </button>
                </div>

                {loadingRegisteredEvents ? (
                    <div
                        style={{
                            padding: "24px",
                            borderRadius: 16,
                            border: "1px solid #e4e7ec",
                            background: "#fff",
                            color: "#667085",
                            textAlign: "center",
                        }}
                    >
                        Loading your registered events...
                    </div>
                ) : registeredEvents.length === 0 ? (
                    <div
                        style={{
                            padding: "28px 24px",
                            borderRadius: 16,
                            border: "1px solid #e4e7ec",
                            background: "#fff",
                            color: "#667085",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#101828" }}>
                            No registered events yet
                        </div>

                        <div style={{ fontSize: 14, color: "#667085" }}>
                            Browse campus events and register to see them here.
                        </div>

                        <button
                            onClick={() => navigate("/events")}
                            style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "none",
                                background: "#006A31",
                                color: "#fff",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Browse Events
                        </button>
                    </div>
                ) : (
                    registeredEvents.map((event) => (
                        <div
                            key={event.id}
                            style={eventCard}
                            onClick={() => navigate("/events")}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.06)";
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    width: "100%",
                                    gap: 16,
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={eventTitle}>{event.title}</div>

                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "#166534",
                                                background: "#ecfdf3",
                                                border: "1px solid #b7dfc8",
                                                borderRadius: 999,
                                                padding: "4px 10px",
                                            }}
                                        >
                                            {event.date}
                                        </span>

                                        <span
                                            style={{
                                                fontSize: 14,
                                                color: "#667085",
                                            }}
                                        >
                                            {event.location}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        minWidth: 40,
                                        height: 40,
                                        borderRadius: 999,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid #d0d5dd",
                                        background: "#fff",
                                        color: "#006A31",
                                        fontSize: 20,
                                        fontWeight: 700,
                                    }}
                                >
                                    →
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </section>
    );
}
