export default function Settings() {
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
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Danger Zone</div>
                    <button className="btn btn-primary">Clear Local Data</button>
                </div>
            </div>
        </div>
    );
}
