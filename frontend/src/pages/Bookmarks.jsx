export default function Bookmarks() {
    const bookmarks = [
        { name: "Willis Library", note: "Quiet floors 4–5" },
        { name: "Union", note: "Food court & study space" },
        { name: "Discovery Park", note: "ECE building entrance" },
    ];

    const recent = [
        "BUS Stop – Highland St",
        "Eagle Point Parking",
        "Gateway Center",
    ];

    return (
        // PAGE STARTS HERE
        <div className="page">
            {/*  This wrapper centers and constrains to phone size */}
            <div className="container phone-demo">
                <div className="phone-card" style={{ padding: 16 }}>
                    <h2 className="h2" style={{ marginBottom: 12 }}>Bookmarks</h2>

                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <button className="btn-primary btn" style={{ width: "auto" }}>
                                + New Bookmark
                            </button>
                            <button className="btn" style={{ width: "auto" }}>Import</button>
                        </div>

                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {bookmarks.map((b, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 0",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                                        <div style={{ color: "var(--muted)", fontSize: 14 }}>
                                            {b.note}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button className="btn" style={{ width: "auto" }}>
                                            Open
                                        </button>
                                        <button className="btn" style={{ width: "auto" }}>
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <h2 className="h2" style={{ marginTop: 20, marginBottom: 12 }}>
                        History
                    </h2>
                    <div className="panel">
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {recent.map((r, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 0",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <span>{r}</span>
                                    <button className="btn" style={{ width: "auto" }}>
                                        Bookmark
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
