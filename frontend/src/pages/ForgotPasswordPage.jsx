import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import useTheme from "../hooks/useTheme";

export default function ForgotPasswordPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const result = await requestPasswordReset(email);
            setMessage(result.message || "If an account exists for that email, a reset link has been sent.");
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--bg)",
                color: "var(--text)",
                display: "flex",
                flexDirection: "column",
                fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
        >
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
            </div>

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    style={{
                        width: "100%",
                        maxWidth: 420,
                        textAlign: "center",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        padding: 24,
                        borderRadius: 12,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                    }}
                >
                    <img
                        src="/UNT-logo.png"
                        alt="UNT"
                        style={{ width: 120, margin: "0 auto 12px" }}
                    />

                    <h2 style={{ color: "#006A31", marginBottom: 12 }}>
                        Forgot Password
                    </h2>
                    <p style={{ marginTop: 0, marginBottom: 20, color: "var(--muted)" }}>
                        Enter your email and we&apos;ll send you a password reset link.
                    </p>

                    <input
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: 12,
                            marginBottom: 12,
                            border: "1px solid var(--input-border)",
                            borderRadius: 8,
                            fontSize: 16,
                            backgroundColor: "var(--input-bg)",
                            color: "var(--input-text)",
                        }}
                    />

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
                        {loading ? "Sending..." : "Send reset link"}
                    </button>

                    {message && (
                        <p style={{ marginTop: 0, marginBottom: 12, color: "var(--unt-green)" }}>
                            {message}
                        </p>
                    )}
                    {error && (
                        <p style={{ marginTop: 0, marginBottom: 12, color: "red" }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="btn btn-outline"
                        style={{
                            width: "100%",
                            fontSize: 16,
                            fontWeight: 500,
                        }}
                    >
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
}
