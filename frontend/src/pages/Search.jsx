export default function Search() {
    const filters = [
        "Dining",
        "Parking",
        "Accessibility Routes",
        "Well-Lit Paths",
    ];

    return (
        <div className="page" style={{ padding: "16px", fontFamily: "system-ui" }}>
            <header style={{ textAlign: "center", marginBottom: 20 }}>
                <img
                    src="https://upload.wikimedia.org/wikipedia/en/7/7f/University_of_North_Texas_logo.svg"
                    alt="UNT"
                    style={{ height: 40 }}
                />
                <nav
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 24,
                        marginTop: 12,
                        flexWrap: "wrap",
                    }}
                >
                    {["Home", "Map", "Search", "Bookmarks", "Settings", "Log Out"].map(
                        (item) => (
                            <a
                                key={item}
                                href="#"
                                style={{
                                    color: item === "Search" ? "#006A31" : "#666",
                                    fontWeight: item === "Search" ? "700" : "500",
                                    textDecoration: "none",
                                }}
                            >
                                {item}
                            </a>
                        )
                    )}
                </nav>
            </header>

            <main style={{ maxWidth: 600, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 20 }}>
                    <h2>Search</h2>
                    <h2 style={{ color: "#555" }}>Routes</h2>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #ccc",
                        borderRadius: 8,
                        padding: "8px 12px",
                        marginBottom: 16,
                    }}
                >
                    <span style={{ fontSize: 18, marginRight: 8 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search for building or location"
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            fontSize: 16,
                        }}
                    />
                </div>

                <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
                    {["Willis Library", "Union", "Eagles Landing"].map((loc) => (
                        <li
                            key={loc}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 0",
                                borderBottom: "1px solid #eee",
                            }}
                        >
                            <span>{loc}</span>
                            <span style={{ color: "#555", fontSize: 20 }}>›</span>
                        </li>
                    ))}
                </ul>

                <h3 style={{ color: "#888", marginBottom: 10 }}>Filters</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {filters.map((f) => (
                        <li
                            key={f}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 8,
                            }}
                        >
                            <span
                                style={{
                                    background: "#ecfdf5",
                                    color: "#006A31",
                                    borderRadius: "50%",
                                    width: 22,
                                    height: 22,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 600,
                                }}
                            >
                                ✓
                            </span>
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}
