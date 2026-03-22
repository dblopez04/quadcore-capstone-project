import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/auth"; 

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setMsg("");
        setLoading(true);

        try {
            await requestPasswordReset(email);
            setMsg("If an account exists for that email, a reset link has been sent.");
        } catch (e) {
            setErr("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: "60px auto" }}>
            <h2>Forgot Password</h2>
            <p>Enter your email and we’ll send you a password reset link.</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", padding: 12, marginBottom: 12 }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", padding: 12 }}
                >
                    {loading ? "Sending..." : "Send reset link"}
                </button>
            </form>

            {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
            {err && <p style={{ marginTop: 12 }}>{err}</p>}

            <button
                type="button"
                onClick={() => navigate("/")}
                style={{ marginTop: 12 }}
            >
                Back to Login
            </button>
        </div>
    );
}
