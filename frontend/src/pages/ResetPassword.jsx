import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!token) {
            setError("This reset link is missing a token. Please request a new email.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await resetPassword(token, password);
            setMessage(result.message || "Password reset successful.");

            // redirect after 2 seconds
            setTimeout(() => {
                navigate("/");
            }, 2000);
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.message || "Unable to reset password.");
        } finally {
            setLoading(false);
        }
    };

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
                        background: "#fff",
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
                        Reset Password
                    </h2>
                    <p style={{ marginTop: 0, marginBottom: 20, color: "#555" }}>
                        Enter a new password for your Mean Green Guide account.
                    </p>

                    <input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
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
                        {loading ? "Resetting..." : "Reset password"}
                    </button>

                    {message && (
                        <p style={{ marginTop: 0, marginBottom: 12, color: "#1f5f2c" }}>
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
