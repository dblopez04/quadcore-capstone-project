import useTheme from "../hooks/useTheme";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    return (
        <div className="container phone-demo">
            <div className="phone-card" style={{ padding: 16 }}>
                <h2 className="h2" style={{ marginBottom: 12 }}>Settings</h2>

                <div className="panel" style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Profile</div>
                    <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                        
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <button className="btn">Change Display Name</button>
                        <button className="btn">Update Email</button>
                        <button className="btn">Reset Password</button>
                    </div>
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
                            “Match System” will automatically follow your computer’s light/dark mode.
                        </div>
                    </div>

                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Danger Zone</div>
                    <button className="btn btn-primary">Clear Local Data</button>
                </div>
            </div>
        </div>
    );
}
