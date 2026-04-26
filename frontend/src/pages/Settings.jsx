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

    const [draftWellLitPaths, setDraftWellLitPaths] = useState(wellLitPaths);
    const [draftAccessibleRoutes, setDraftAccessibleRoutes] = useState(accessibleRoutes);
    const [draftDefaultMapView, setDraftDefaultMapView] = useState(defaultMapView);
    const [draftTheme, setDraftTheme] = useState(theme);

    const [profilePicture, setProfilePicture] = useState(() => {
        return localStorage.getItem("profilePicture") || "";
    });

    const [draftProfilePicture, setDraftProfilePicture] = useState(profilePicture);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [zoom, setZoom] = useState(1);

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

    function openSection(section) {
        setActiveSection(section);
        setMessage("");
        setResetError("");

        setDraftWellLitPaths(wellLitPaths);
        setDraftAccessibleRoutes(accessibleRoutes);
        setDraftDefaultMapView(defaultMapView);
        setDraftTheme(theme);
    }

    function saveWellLitPaths() {
        setWellLitPaths(draftWellLitPaths);
        localStorage.setItem("wellLitPaths", draftWellLitPaths);
        showToast("Well-lit paths preference saved.", "success");
        setActiveSection(null);
    }

    function saveAccessibleRoutes() {
        setAccessibleRoutes(draftAccessibleRoutes);
        localStorage.setItem("accessibleRoutes", draftAccessibleRoutes);
        showToast("Accessible routes preference saved.", "success");
        setActiveSection(null);
    }

    function saveDefaultMapView() {
        setDefaultMapView(draftDefaultMapView);
        localStorage.setItem("defaultMapView", draftDefaultMapView);
        showToast("Default map view saved.", "success");
        setActiveSection(null);
    }

    function saveTheme() {
        setTheme(draftTheme);
        showToast("Appearance preference saved.", "success");
        setActiveSection(null);
    }

    function cancelSettingsEdit() {
        setDraftWellLitPaths(wellLitPaths);
        setDraftAccessibleRoutes(accessibleRoutes);
        setDraftDefaultMapView(defaultMapView);
        setDraftTheme(theme);
        setDraftProfilePicture(profilePicture);
        setActiveSection(null);
        setMessage("");
        setResetError("");
    }

    function handleProfilePictureChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setDraftProfilePicture(reader.result);
        };

        reader.readAsDataURL(file);
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
        localStorage.removeItem("profilePicture");

        setWellLitPaths(false);
        setAccessibleRoutes(false);
        setDefaultMapView("Campus");
        setResetEmail("");
        setResetError("");
        setMessage("Local settings were cleared.");
        setActiveSection(null);
        setProfilePicture("");
        setDraftProfilePicture("");
    }

    return (
        <div className="container phone-demo">
            <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
                <h2 className="h2" style={{ marginBottom: 12 }}>Settings</h2>

                <div className="panel" style={{ marginBottom: 16, textAlign: "center" }}>
                    {/* Avatar */}
                    <label
                        style={{ cursor: "pointer", display: "inline-block", position: "relative" }}
                        onClick={() => setShowProfileModal(true)}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            style={{ display: "none" }}
                        />

                        {draftProfilePicture ? (
                            <img
                                src={draftProfilePicture}
                                alt="Profile"
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "3px solid var(--border)",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: "50%",
                                    background: "#e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 32,
                                    color: "#6b7280",
                                }}
                            >
                                +
                            </div>
                        )}

                        {/* Edit icon */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                background: "white",
                                borderRadius: "50%",
                                padding: 6,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                fontSize: 12
                            }}
                        >
                            ✏️
                        </div>
                    </label>

                    <div style={{ marginTop: 12, fontWeight: 600 }}>Profile Picture</div>

                    <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                        Click the picture to upload a new image.
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setProfilePicture(draftProfilePicture);
                                localStorage.setItem("profilePicture", draftProfilePicture);
                                showToast("Profile picture updated.", "success");
                            }}
                        >
                            Save
                        </button>

                        <button
                            className="btn"
                            onClick={() => setDraftProfilePicture(profilePicture)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

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
                                checked={draftWellLitPaths}
                                onChange={(e) => setDraftWellLitPaths(e.target.checked)}
                            />
                            Enable Well-Lit Paths
                        </label>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={saveWellLitPaths}>
                                Save
                            </button>

                            <button className="btn" onClick={cancelSettingsEdit}>
                                Cancel
                            </button>
                        </div>
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
                                checked={draftAccessibleRoutes}
                                onChange={(e) => setDraftAccessibleRoutes(e.target.checked)}
                            />
                            Prefer Accessible Routes
                        </label>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={saveAccessibleRoutes}>
                                Save
                            </button>

                            <button className="btn" onClick={cancelSettingsEdit}>
                                Cancel
                            </button>
                        </div>
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
                            value={draftDefaultMapView}
                            onChange={(e) => setDraftDefaultMapView(e.target.value)}
                        >
                            <option value="Campus">Campus</option>
                            <option value="Parking">Parking</option>
                            <option value="Transit">Transit</option>
                        </select>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={saveDefaultMapView}>
                                Save
                            </button>

                            <button className="btn" onClick={cancelSettingsEdit}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                
                <div className="panel">
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Appearance</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                        Choose how the app looks.
                    </div>

                    <select
                        className="search-input"
                        value={draftTheme}
                        onChange={(e) => setDraftTheme(e.target.value)}
                    >
                        <option value="system">Match System</option>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                    </select>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button className="btn btn-primary" onClick={saveTheme}>
                            Save
                        </button>

                        <button className="btn" onClick={cancelSettingsEdit}>
                            Cancel
                        </button>
                    </div>

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

                {showProfileModal && (
                    <div
                        onClick={() => setShowProfileModal(false)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0,0,0,0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 999,
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: "white",
                                padding: 20,
                                borderRadius: 12,
                                textAlign: "center",
                            }}
                        >
                            <img
                                src={draftProfilePicture || profilePicture}
                                alt="Profile Large"
                                style={{
                                    width: 200 * zoom,
                                    height: 200 * zoom,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    marginBottom: 12,
                                }}
                            />

                            <div style={{ marginBottom: 10 }}>
                                <input
                                    type="range"
                                    min="1"
                                    max="2"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                />
                            </div>

                            <button className="btn" onClick={() => setShowProfileModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
