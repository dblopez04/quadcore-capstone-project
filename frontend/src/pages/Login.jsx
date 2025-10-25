export default function Login() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                fontFamily: "system-ui, sans-serif",
                padding: "16px",
            }}
        >
            <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
                <img
                    src="https://upload.wikimedia.org/wikipedia/en/7/7f/University_of_North_Texas_logo.svg"
                    alt="UNT Logo"
                    style={{ width: 140, margin: "0 auto 16px" }}
                />
                <h2 style={{ color: "#006A31", marginBottom: 24 }}>Getting Around UNT</h2>

                <input
                    type="email"
                    placeholder="Email"
                    style={{
                        width: "100%",
                        padding: 12,
                        marginBottom: 12,
                        border: "1px solid #d9d9d9",
                        borderRadius: 6,
                        fontSize: 16,
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    style={{
                        width: "100%",
                        padding: 12,
                        marginBottom: 16,
                        border: "1px solid #d9d9d9",
                        borderRadius: 6,
                        fontSize: 16,
                    }}
                />

                <button
                    style={{
                        width: "100%",
                        padding: 12,
                        backgroundColor: "#666",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 16,
                        marginBottom: 16,
                    }}
                >
                    Login
                </button>

                <div style={{ marginBottom: 12 }}>
                    <a href="#" style={{ fontWeight: 600, color: "#111", textDecoration: "none" }}>
                        Register
                    </a>
                    <br />
                    <a href="#" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>
                        Forgot Password
                    </a>
                </div>

                <button
                    style={{
                        width: "100%",
                        padding: 12,
                        backgroundColor: "#eee",
                        color: "#666",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 16,
                    }}
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    );
}
