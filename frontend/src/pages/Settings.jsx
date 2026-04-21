import { useEffect, useState } from "react";
import useTheme from "../hooks/useTheme";
import { fetchProfile, updateProfileEmail } from "../api/userService";
import { useToast } from "../components/ToastProvider";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingEmail, setSavingEmail] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            try {
                const data = await fetchProfile();
                if (!cancelled) {
                    setEmail(data?.user?.email || "");
                }
            } catch (error) {
                console.error("Failed to load settings profile:", error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleEmailSubmit(event) {
        event.preventDefault();
        setSavingEmail(true);

        try {
            const data = await updateProfileEmail(email);
            setEmail(data?.user?.email || email);
            showToast("Email updated.", "success");
        } catch (error) {
            console.error(error);
            showToast(error.message || "Unable to update email.", "error");
        } finally {
            setSavingEmail(false);
        }
    }

    return (
        <div className="container phone-demo">
            <div className="phone-card" style={{ padding: 16 }}>
                <h2 className="h2" style={{ marginBottom: 12 }}>Settings</h2>

                <div className="panel" style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Profile</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                        Update the email address used for event confirmations and reminder emails.
                    </div>
                    <form onSubmit={handleEmailSubmit} style={{ display: "grid", gap: 10 }}>
                        <input
                            className="search-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading || savingEmail}
                            placeholder="you@meangreenguide.com"
                        />
                        <button className="btn" type="submit" disabled={loading || savingEmail}>
                            {savingEmail ? "Saving..." : "Update Email"}
                        </button>
                    </form>
                </div>

                <div className="panel" style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Preferences</div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <button className="btn">Enable Well-Lit Paths</button>
                        <button className="btn">Prefer Accessible Routes</button>
                        <button className="btn">Default Map View: Campus</button>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Appearance</div>
                        <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                            Choose how the app looks.
                        </div>

                        <select
                            className="search-input"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            <option value="system">Match System</option>
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                        </select>

                        <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                            "Match System" will automatically follow your computer's light/dark mode.
                        </div>
                    </div>

                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Danger Zone</div>
                    <button className="btn btn-primary">Clear Local Data</button>
                </div>
            </div>
        </div>
    );
}
