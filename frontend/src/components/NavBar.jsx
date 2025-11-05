import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <header className="nav">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                    src="/UNT-logo2.png"
                    alt="UNT"
                    style={{ height: 28 }}
                />
                <span style={{ fontWeight: 800, letterSpacing: 0.2 }}>
                    Getting Around UNT
                </span>
            </div>

            <nav className="nav-menu">
                <NavLink
                    to="/home"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    Home
                </NavLink>

                <NavLink
                    to="/map"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    Map
                </NavLink>

                <NavLink
                    to="/search"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    Search
                </NavLink>

                <NavLink
                    to="/bookmarks"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    Bookmarks
                </NavLink>

                <NavLink
                    to="/about"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    About
                </NavLink>

                <NavLink
                    to="/help"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    Help
                </NavLink>

                <NavLink
                    to="/settings"
                    style={({ isActive }) => ({
                        color: "#fff",
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                        fontWeight: 600,
                    })}
                >
                    Settings
                </NavLink>

                <button
                    className="btn btn-outline"
                    style={{ width: "auto" }}
                    onClick={handleLogout}
                >
                    Log Out
                </button>
            </nav>
        </header>
    );
}
