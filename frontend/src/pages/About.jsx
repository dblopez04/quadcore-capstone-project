export default function About() {
    const cardStyle = {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
        marginBottom: 20,
    };

    const sectionTitle = {
        marginTop: 0,
        marginBottom: 10,
        color: "var(--text)",
    };

    const paragraph = {
        margin: 0,
        color: "var(--muted)",
        lineHeight: 1.6,
    };

    return (
        <section style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ marginBottom: "1.5rem" }}>About</h1>

            {/* Overview */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Project Overview</h2>
                <p style={paragraph}>
                    Mean Green Guide is a campus navigation and event discovery web application
                    designed to help students, faculty, and visitors explore the University of North Texas
                    more efficiently. It combines maps, search, events, bookmarks, and registration tools
                    into a single, easy-to-use interface.
                </p>
            </div>

            {/* Features */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Key Features</h2>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--muted)", lineHeight: 1.7 }}>
                    <li>Interactive campus map using Leaflet</li>
                    <li>Search for buildings and campus locations</li>
                    <li>Event calendar with filtering and date selection</li>
                    <li>Register and manage your events</li>
                    <li>Bookmark important places and activities</li>
                    <li>Admin panel for managing campus events</li>
                </ul>
            </div>

            {/* Users */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Who It Helps</h2>
                <p style={paragraph}>
                    This application is designed for UNT students, staff, and visitors who need a
                    convenient way to navigate campus, discover events, and keep track of important
                    locations and activities.
                </p>
            </div>

            {/* Tech */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Technology Stack</h2>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--muted)", lineHeight: 1.7 }}>
                    <li>React + Vite for the frontend</li>
                    <li>React Router for navigation</li>
                    <li>Leaflet + OpenStreetMap for mapping</li>
                    <li>REST APIs for events, users, and registrations</li>
                </ul>
            </div>

            {/* Goal */}
            <div style={cardStyle}>
                <h2 style={sectionTitle}>Project Goal</h2>
                <p style={paragraph}>
                    The goal of this project is to create a practical and user-friendly campus companion
                    application that improves access to navigation and campus event information while
                    enhancing the overall campus experience.
                </p>
            </div>

            <div style={{ textAlign: "center", marginTop: 20, color: "var(--muted)", fontSize: 14 }}>
                Developed as part of an Information Technology project at UNT
            </div>

        </section>
    );
}
