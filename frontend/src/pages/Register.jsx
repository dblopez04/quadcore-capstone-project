import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../api/auth";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [userRole, setUserRole] = useState("STUDENT"); // default
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            //  If backend expects different field names, adjust here.
            const payload = {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                user_role: userRole,
            };

            const result = await registerRequest(payload);
            console.log("Registration success:", result);

            // After successful registration, go to login page
            navigate("/");
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const fieldStyle = {
        width: "100%",
        padding: "14px 16px",
        marginBottom: 12,
        border: "1px solid #d0d5dd",
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: "#fff",
        boxSizing: "border-box",
        outline: "none",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
        >
            {/* Top Strip (same as Login) */}
            <div
                className="nav"
                style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingInline: 16,
                    backgroundColor: "#006A31", // UNT green
                    color: "#fff",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* logo lives in /public, so use absolute path */}
                    <img src="/UNT-logo2.png" alt="UNT" style={{ height: 28 }} />
                    <span style={{ fontWeight: 800 }}>Getting Around UNT</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <a href="/help" style={{ color: "#fff", textDecoration: "none" }}>
                        Help
                    </a>
                </div>
            </div>

            {/* Center Card */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                }}
            >
                <form
                    onSubmit={handleRegister}
                    style={{
                        width: "100%",
                        maxWidth: 480,
                        textAlign: "center",
                        background: "#fff",
                        padding: 24,
                        borderRadius: 12,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                    }}
                >
                    <img
                        // use the actual filename from /public
                        src="/UNT-logo.png"
                        alt="UNT"
                        style={{ width: 120, margin: "0 auto 12px" }}
                    />

                    <h2 style={{ color: "#006A31", marginBottom: 20 }}>
                        Create Your UNT Account
                    </h2>

                    {/* First Name */}
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        style={fieldStyle}
                    />

                    {/* Last Name */}
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        style={fieldStyle}
                    />

                    {/* Email */}
                    <input
                        type="email"
                        placeholder="UNT Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={fieldStyle}
                    />

                    {/* Phone Number */}
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        style={fieldStyle}
                    />

                    {/* Role */}
                    <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        style={fieldStyle}
                    >
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="VISITOR">Visitor</option>
                    </select>

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            ...fieldStyle,
                            marginBottom: 16,
                        }}
                    />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn"
                        style={{
                            width: "100%",
                            marginBottom: 12,
                            fontSize: 16,
                            fontWeight: 600,
                        }}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                    {error && (
                        <p style={{ color: "red", marginBottom: 12 }}>{error}</p>
                    )}

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="btn btn-outline"
                        style={{
                            width: "100%",
                            fontSize: 16,
                            fontWeight: 500,
                        }}
                    >
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
}
