import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logoutRequest } from "../api/auth";
import { clearAuthMode } from "../utils/authMode";

export default function Navbar() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        setIsOpen(false);
        try {
            await logoutRequest();
        } catch (err) {
            console.warn("Logout request failed:", err);
        }
        clearAuthMode();
        localStorage.removeItem("accessToken");
        navigate("/");
    };

    const linkStyle = ({ isActive }) => ({
        color: "#fff",
        textDecoration: "none",
        padding: "6px 10px",
        borderRadius: 8,
        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        fontWeight: 600,
    });

    return (
        <header className="nav">
            <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/UNT-logo2.png" alt="UNT" style={{ height: 28 }} />
                <span style={{ fontWeight: 800, letterSpacing: 0.2 }}>
                    Getting Around UNT
                </span>
            </div>

            <button
                className="hamburger"
                aria-label="Open menu"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((v) => !v)}
            >
                ☰
            </button>

            {/* Desktop menu */}
            <nav className="nav-menu desktop-menu">
                <NavLink to="/home" style={linkStyle}>Home</NavLink>
                <NavLink to="/map" style={linkStyle}>Map</NavLink>
                <NavLink to="/search" style={linkStyle}>Search</NavLink>
                <NavLink to="/bookmarks" style={linkStyle}>Bookmarks</NavLink>
                <NavLink to="/about" style={linkStyle}>About</NavLink>
                <NavLink to="/events" style={linkStyle}>Events</NavLink>
                <NavLink to="/help" style={linkStyle}>Help</NavLink>
                <NavLink to="/settings" style={linkStyle}>Settings</NavLink>

                <button className="btn btn-outline" style={{ width: "auto" }} onClick={handleLogout}>
                    Log Out
                </button>
            </nav>

            {/* Mobile drawer */}
            {isOpen && <div className="drawer-backdrop" onClick={() => setIsOpen(false)} />}

            <nav className={`mobile-drawer ${isOpen ? "open" : ""}`}>
                <NavLink to="/home" onClick={() => setIsOpen(false)}>Home</NavLink>
                <NavLink to="/map" onClick={() => setIsOpen(false)}>Map</NavLink>
                <NavLink to="/search" onClick={() => setIsOpen(false)}>Search</NavLink>
                <NavLink to="/bookmarks" onClick={() => setIsOpen(false)}>Bookmarks</NavLink>
                <NavLink to="/about" onClick={() => setIsOpen(false)}>About</NavLink>
                <NavLink to="/events" onClick={() => setIsOpen(false)}>Events</NavLink>
                <NavLink to="/help" onClick={() => setIsOpen(false)}>Help</NavLink>
                <NavLink to="/settings" onClick={() => setIsOpen(false)}>Settings</NavLink>

                <button className="drawer-logout" onClick={handleLogout}>
                    Log Out
                </button>
            </nav>
        </header>
    );
}
