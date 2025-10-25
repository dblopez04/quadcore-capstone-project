import Navbar from "./Navbar";

export default function Layout({ children }) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <footer style={{ padding: "0.75rem 1rem", background: "#111", color: "#aaa", fontSize: 12 }}>
                © {new Date().getFullYear()} QuadCore
            </footer>
        </div>
    );
}
