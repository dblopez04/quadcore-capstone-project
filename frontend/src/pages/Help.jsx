export default function Help() {
    const cardStyle = {
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
        marginBottom: 20,
    };

    const sectionTitle = {
        marginTop: 0,
        marginBottom: 10,
        color: "#101828",
    };

    const text = {
        margin: 0,
        color: "#555",
        lineHeight: 1.6,
    };

    return (
        <section style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ marginBottom: "1.5rem" }}>Help</h1>

            {/* Overview */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>How to Use This App</h2>
                <p style={text}>
                    This application helps you navigate the UNT campus, discover events,
                    and manage your activities. Use the sections below to learn how to
                    use each feature.
                </p>
            </div>

            {/* Navigation */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Navigation Guide</h2>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#444", lineHeight: 1.7 }}>
                    <li><strong>Home:</strong> Overview and quick access to features</li>
                    <li><strong>Map:</strong> View campus locations and navigate</li>
                    <li><strong>Search:</strong> Find buildings and places</li>
                    <li><strong>Events:</strong> Browse and register for campus events</li>
                    <li><strong>Bookmarks:</strong> View saved places and events</li>
                    <li><strong>Admin:</strong> Manage events (admin users only)</li>
                </ul>
            </div>

            {/* Map */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Using the Map</h2>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#444", lineHeight: 1.7 }}>
                    <li>Zoom using your mouse wheel or trackpad</li>
                    <li>Click on locations to view details</li>
                    <li>Use "View on Map" buttons from events or bookmarks</li>
                </ul>
            </div>

            {/* Events */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Managing Events</h2>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#444", lineHeight: 1.7 }}>
                    <li>Browse events from the Events page</li>
                    <li>Use filters and calendar to find events by date</li>
                    <li>Click "Register" to join an event</li>
                    <li>View your registered events on the Home page</li>
                    <li>Click "Unregister" if you no longer want to attend</li>
                </ul>
            </div>

            {/* Troubleshooting */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Troubleshooting</h2>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#444", lineHeight: 1.7 }}>
                    <li>If events are not loading, try refreshing the page</li>
                    <li>Make sure you are logged in to register for events</li>
                    <li>Check your internet connection if maps do not load</li>
                </ul>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 20, color: "#777", fontSize: 14 }}>
                Need more help? Contact your system administrator or instructor.
            </div>
        </section>
    );
}