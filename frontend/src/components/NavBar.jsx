import { NavLink } from "react-router-dom";

const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium";
const active =
    "bg-gray-200 text-black";
const inactive =
    "text-white hover:bg-gray-700 hover:text-white";

export default function Navbar() {
    return (
        <nav style={{ background: "#111", padding: "0.5rem 1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: "white", fontWeight: 700, marginRight: "1rem" }}>
                    QuadCore
                </span>
                <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Home</NavLink>
                <NavLink to="/map" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Map</NavLink>
                <NavLink to="/about" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>About</NavLink>
                <NavLink to="/help" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Help</NavLink>
                {/* add more tabs that match your Figma later */}
            </div>
        </nav>
    );
}
