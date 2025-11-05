export default function AuthHeader() {
    return (
        <header style={{
            width: "100%",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e5e7eb",
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 10
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                    src="UNT-logo2.png"
                    alt="UNT"
                    style={{ height: 28 }}
                />
                <span style={{ fontWeight: 700 }}>Getting Around UNT</span>
            </div>

            <nav style={{ display: "flex", gap: 12 }}>
                <a href="/help" style={{ color: "#006A31", textDecoration: "none", fontWeight: 600 }}>
                    Help
                </a>
            </nav>
        </header>
    );
}
