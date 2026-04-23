import { useEffect, useState } from "react";
import { requestPasswordReset } from "../api/auth";
import { fetchProfile, updateProfileEmail } from "../api/userService";
import { useToast } from "../components/ToastProvider";
import useTheme from "../hooks/useTheme";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { showToast } = useToast();
    const [activeSection, setActiveSection] = useState(null);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingEmail, setSavingEmail] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState("");
    const [wellLitPaths, setWellLitPaths] = useState(() => {
        return localStorage.getItem("wellLitPaths") === "true";
    });

    const [accessibleRoutes, setAccessibleRoutes] = useState(() => {
        return localStorage.getItem("accessibleRoutes") === "true";
    });

    const [defaultMapView, setDefaultMapView] = useState(() => {
        return localStorage.getItem("defaultMapView") || "Campus";
    });

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

    useEffect(() => {
        localStorage.setItem("wellLitPaths", wellLitPaths);
        localStorage.setItem("accessibleRoutes", accessibleRoutes);
        localStorage.setItem("defaultMapView", defaultMapView);
    }, [wellLitPaths, accessibleRoutes, defaultMapView]);

    function openSection(section) {
        setActiveSection(section);
        setMessage("");
        setResetError("");
    }

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

    async function handlePasswordResetSubmit(event) {
        event.preventDefault();
        setResetError("");
        setMessage("");

        try {
            setResetLoading(true);
            await requestPasswordReset(resetEmail);
            setResetEmail("");
            setMessage("If an account exists for that email, a reset link has been sent.");
        } catch (error) {
            console.error(error);
            setResetError("Something went wrong. Please try again.");
        } finally {
            setResetLoading(false);
        }
    }

    function clearLocalSettings() {
        localStorage.removeItem("wellLitPaths");
        localStorage.removeItem("accessibleRoutes");
        localStorage.removeItem("defaultMapView");

        setWellLitPaths(false);
        setAccessibleRoutes(false);
        setDefaultMapView("Campus");
        setResetEmail("");
        setResetError("");
        setMessage("Local settings were cleared.");
        setActiveSection(null);
    }

    return (
        <div className="container phone-demo">
            <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
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

                    <button
                        className="btn"
                        onClick={() => openSection("password")}
                        style={{ marginTop: 10 }}
                    >
                        Reset Password
                    </button>
                </div>

                <div className="panel" style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Preferences</div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <button className="btn" onClick={() => openSection("wellLit")}>
                            Well-Lit Paths: {wellLitPaths ? "On" : "Off"}
                        </button>

                        <button className="btn" onClick={() => openSection("accessible")}>
                            Accessible Routes: {accessibleRoutes ? "On" : "Off"}
                        </button>

                        <button className="btn" onClick={() => openSection("mapView")}>
                            Default Map View: {defaultMapView}
                        </button>
                    </div>
                </div>

                {activeSection === "password" && (
                    <form className="panel" onSubmit={handlePasswordResetSubmit} style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Reset Password</div>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="search-input"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            style={{ marginBottom: 8 }}
                        />

                        <button className="btn btn-primary" disabled={resetLoading} type="submit">
                            {resetLoading ? "Sending..." : "Send Reset Link"}
                        </button>

                        {message && (
                            <div style={{ marginTop: 8, color: "var(--unt-green)", fontSize: 14 }}>
                                {message}
                            </div>
                        )}

                        {resetError && (
                            <div style={{ marginTop: 8, color: "#dc2626", fontSize: 14 }}>
                                {resetError}
                            </div>
                        )}
                    </form>
                )}

                {activeSection === "wellLit" && (
                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Well-Lit Paths</div>

                        <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                            Prefer routes with better lighting when route options are available.
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                                type="checkbox"
                                checked={wellLitPaths}
                                onChange={(e) => setWellLitPaths(e.target.checked)}
                            />
                            Enable Well-Lit Paths
                        </label>
                    </div>
                )}

                {activeSection === "accessible" && (
                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Accessible Routes</div>

                        <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                            Prefer routes that are more accessible when route options are available.
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                                type="checkbox"
                                checked={accessibleRoutes}
                                onChange={(e) => setAccessibleRoutes(e.target.checked)}
                            />
                            Prefer Accessible Routes
                        </label>
                    </div>
                )}

                {activeSection === "mapView" && (
                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Default Map View</div>

                        <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                            Choose which map view should be selected by default.
                        </div>

                        <select
                            className="search-input"
                            value={defaultMapView}
                            onChange={(e) => setDefaultMapView(e.target.value)}
                        >
                            <option value="Campus">Campus</option>
                            <option value="Parking">Parking</option>
                            <option value="Transit">Transit</option>
                        </select>
                    </div>
                )}

                <div className="panel">
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
                        "Match System" will automatically follow your computer&apos;s light/dark mode.
                    </div>

                    <div style={{ fontWeight: 600, marginTop: 20, marginBottom: 8 }}>
                        Danger Zone
                    </div>

                    <button className="btn btn-primary" onClick={clearLocalSettings}>
                        Clear Local Data
                    </button>

                    {message && activeSection !== "password" && (
                        <div style={{ marginTop: 8, color: "var(--unt-green)", fontSize: 14 }}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
