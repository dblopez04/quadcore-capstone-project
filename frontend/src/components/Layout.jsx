// src/components/Layout.jsx
import Navbar from "./Navbar";

export default function Layout({ children, narrow = false }) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                <div className={narrow ? "container phone-demo" : "container"}>
                    {narrow ? <div className="phone-card" style={{ padding: 16 }}>{children}</div> : children}
                </div>
            </main>
            <footer style={{ padding: "0.75rem 1rem", background: "#111", color: "#aaa", fontSize: 12 }}>
                © {new Date().getFullYear()} QuadCore
            </footer>
        </div>
    );
}
