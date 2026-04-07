import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, logoutRequest } from "../api/auth";
import { setAuthenticatedMode, setGuestMode } from "../utils/authMode";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleGuest = async () => {
        setGuestMode();
        localStorage.removeItem("accessToken");
        try {
            await logoutRequest();
        } catch (err) {
            console.warn("Guest-mode logout request failed:", err);
        }
        navigate("/map");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginRequest(email, password);
            console.log("Login success:", result);

            setAuthenticatedMode();
            localStorage.setItem("user", JSON.stringify(result.user));

            // redirect after successful login
            navigate("/home");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f6f8f7",
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
                    paddingInline: 16,
                    backgroundColor: "#006A31",
                    color: "#fff",
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
                    padding: 24,
                    justifyContent: "center",
                    padding: 16,
                }}
            >
                <form
                    onSubmit={handleLogin}
                    style={{
                        width: "100%",
                        maxWidth: 420,
                        textAlign: "center",
                        background: "#fff",
                        padding: "32px 24px",
                        borderRadius: 18,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                    }}
                >
                    <img
                        src="/UNT-logo.png"
                        alt="UNT"
                        style={{ width: 110, margin: "0 auto 10px", display: "block" }}
                    />

                    <h1
                        style={{
                            color: "#006A31",
                            margin: "0 0 24px 0",
                            fontSize: "1.8rem",
                            fontWeight: 800,
                            lineHeight: 1.2,
                        }}
                    >
                        Getting Around UNT
                    </h1>

                    {/* EMAIL INPUT */}
                    <input
                        type="email"
                        placeholder="UNT Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            marginBottom: 14,
                            border: "1px solid #d0d5dd",
                            borderRadius: 12,
                            fontSize: 16,
                            backgroundColor: "#fff",
                            boxSizing: "border-box",
                            outline: "none",
                        }}
                    />

                    {/* PASSWORD INPUT */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            marginBottom: 14,
                            border: "1px solid #d0d5dd",
                            borderRadius: 12,
                            fontSize: 16,
                            backgroundColor: "#fff",
                            boxSizing: "border-box",
                            outline: "none",
                        }}
                    />

                    {/* LOGIN BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn"
                        style={{
                            width: "100%",
                            marginBottom: 12,
                            fontSize: 16,
                            fontWeight: 600,
                        }}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {error && (
                        <p style={{ color: "red", marginBottom: 12 }}>{error}</p>
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 18,
                        }}
                    >
                        <a
                            href="/register"
                            style={{
                                textDecoration: "none",
                                fontWeight: 600,
                                color: "#101828",
                                fontSize: 15,
                            }}
                        >
                            Register
                        </a>
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "#667085",
                                cursor: "pointer",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Forgot Password
                        </button>    

                    </div>

                    <button
                        type="button"
                        onClick={handleGuest}
                        className="btn btn-outline"
                        style={{
                            width: "100%",
                            fontSize: 16,
                            fontWeight: 600,
                            borderRadius: 14,
                            padding: "12px 16px",
                        }}
                    >
                        Continue as Guest
                    </button>
                </form>
            </div>
        </div>
    );
}
