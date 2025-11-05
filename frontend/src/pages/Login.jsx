import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
        >
            {/* Top Strip */}
            <div
                className="nav"
                style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src="/UNT-logo2.png" alt="UNT" style={{ height: 28 }} />
                    <span style={{ fontWeight: 800 }}>Getting Around UNT</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <a href="/help" style={{ color: "#fff", textDecoration: "none" }}>
                        Help
                    </a>
                </div>
            </div>

            {/* Center Card */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 420,
                        textAlign: "center",
                        background: "#fff",
                        padding: 24,
                        borderRadius: 12,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                    }}
                >
                    <img
                        src="unt-logo.png"
                        //alt="UNT Logo"
                        style={{ width: 120, margin: "0 auto 12px" }}
                    />

                    <h2 style={{ color: "#006A31", marginBottom: 20 }}>
                        Getting Around UNT
                    </h2>

                    <input
                        type="email"
                        placeholder="UNT Email"
                        style={{
                            width: "100%",
                            padding: 12,
                            marginBottom: 12,
                            border: "1px solid #d9d9d9",
                            borderRadius: 8,
                            fontSize: 16,
                            backgroundColor: "#f9faff",
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
                            borderRadius: 8,
                            fontSize: 16,
                            backgroundColor: "#f9faff",
                        }}
                    />

                    <button
                        onClick={() => navigate("/home")}
                        className="btn-primary btn"
                        style={{
                            width: "100%",
                            marginBottom: 12,
                            fontSize: 16,
                            fontWeight: 600,
                        }}
                    >
                        Login
                    </button>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 12,
                        }}
                    >
                        <a
                            href="/register"
                            style={{ textDecoration: "none", fontWeight: 600, color: "#111" }}
                        >
                            Register
                        </a>
                        <a
                            href="/forgot"
                            style={{ textDecoration: "none", color: "#666" }}
                        >
                            Forgot Password
                        </a>
                    </div>

                    <button
                        onClick={() => navigate("/map")}
                        className="btn btn-outline"
                        style={{
                            width: "100%",
                            fontSize: 16,
                            fontWeight: 500,
                        }}
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}
