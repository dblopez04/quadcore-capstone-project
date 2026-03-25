import { useNavigate } from "react-router-dom";

const cardStyle = {
    padding: "1.5rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "12px",
};

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
export default function Home() {
    const navigate = useNavigate();
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

            {/* UPCOMING EVENTS PREVIEW */}
            <div>
                <h2 style={{ marginBottom: "1rem" }}>Upcoming Events</h2>
                <div style={cardStyle}>Event 1</div>
                <div style={{ height: "10px" }} />
                <div style={cardStyle}>Event 2</div>
            </div>

        </section>
    );
}
