import useTheme from "../hooks/useTheme";
import { useEffect, useState } from "react";
import { requestPasswordReset } from "../api/auth";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState(null);
    const [message, setMessage] = useState("");
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
        localStorage.setItem("wellLitPaths", wellLitPaths);
        localStorage.setItem("accessibleRoutes", accessibleRoutes);
        localStorage.setItem("defaultMapView", defaultMapView);
    }, [wellLitPaths, accessibleRoutes, defaultMapView]);

    return (
        <div className="container phone-demo">
            <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
                <h2 className="h2" style={{ marginBottom: 12 }}>Settings</h2>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Profile</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                        
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveSection("password");
                                setMessage("");
                                setResetError("");
                            }}
                        >
                            Reset Password
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Preferences</div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveSection("wellLit");
                                setMessage("");
                                setResetError("");
                            }}
                        >
                            Well-Lit Paths: {wellLitPaths ? "On" : "Off"}
                        </button>

                        <button
                            className="btn"
                            onClick={() => {
                                setActiveSection("accessible");
                                setMessage("");
                                setResetError("");
                            }}
                        >
                            Accessible Routes: {accessibleRoutes ? "On" : "Off"}
                        </button>

                        <button
                            className="btn"
                            onClick={() => {
                                setActiveSection("mapView");
                                setMessage("");
                                setResetError("");
                            }}
                        >
                            Default Map View: {defaultMapView}
                        </button>
                    </div>
                </div>

                

                {activeSection === "password" && (
                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Reset Password
                        </div>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="search-input"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            style={{ marginBottom: 8 }}
                        />

                        <button
                            className="btn btn-primary"
                            disabled={resetLoading}
                            onClick={async () => {
                                setResetError("");
                                setMessage("");

                                try {
                                    setResetLoading(true);
                                    await requestPasswordReset(resetEmail);
                                    setResetEmail("");
                                    setMessage("If an account exists for that email, a reset link has been sent.");
                                } catch (e) {
                                    setResetError("Something went wrong. Please try again.");
                                } finally {
                                    setResetLoading(false);
                                }
                            }}
                        >
                            {resetLoading ? "Sending..." : "Send Reset Link"}
                        </button>
                        {message && (
                            <div style={{ marginTop: 8, color: "green", fontSize: 14 }}>
                                {message}
                            </div>
                        )}

                        {resetError && (
                            <div style={{ marginTop: 8, color: "red", fontSize: 14 }}>
                                {resetError}
                            </div>
                        )}
                    </div>
                )}

                {activeSection === "wellLit" && (
                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Well-Lit Paths
                        </div>

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
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Accessible Routes
                        </div>

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
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Default Map View
                        </div>

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

                <div style={{ marginBottom: 24 }}>
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

                    <button
                        className="btn btn-primary"
                        onClick={() => {
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
                        }}
                    >
                        Clear Local Data
                    </button>

                    {message && (
                        <div style={{ marginTop: 8, color: "green", fontSize: 14 }}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
