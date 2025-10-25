import { useNavigate } from "react-router-dom";
import AuthHeader from "../components/AuthHeader";

export default function Login() {
    const navigate = useNavigate();

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
            {/* Top Bar */}
            <AuthHeader />

            {/* Login Card */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 420,
                        textAlign: "center",
                        background: "#fff",
                        padding: 24,
                        borderRadius: 10,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                >
                    {/* UNT Logo */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/en/7/7f/University_of_North_Texas_logo.svg"
                        alt="UNT Logo"
                        style={{ width: 140, margin: "0 auto 16px" }}
                    />

                    <h2 style={{ color: "#006A31", marginBottom: 24 }}>
                        Getting Around UNT
                    </h2>

                    {/* Email Input */}
                    <input
                        type="email"
                        placeholder="Email"
                        style={{
                            width: "100%",
                            padding: 12,
                            marginBottom: 12,
                            border: "1px solid #d9d9d9",
                            borderRadius: 6,
                            fontSize: 16,
                            backgroundColor: "#f9faff",
                        }}
                    />

                    {/* Password Input */}
                    <input
                        type="password"
                        placeholder="Password"
                        style={{
                            width: "100%",
                            padding: 12,
                            marginBottom: 16,
                            border: "1px solid #d9d9d9",
                            borderRadius: 6,
                            fontSize: 16,
                            backgroundColor: "#f9faff",
                        }}
                    />

                    {/* Login Button */}
                    <button
                        onClick={() => navigate("/home")} 
                        style={{
                            width: "100%",
                            padding: 12,
                            marginBottom: 16,
                            backgroundColor: "#555",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 16,
                            fontWeight: 600,
                        }}
                    >
                        Login
                    </button>

                    {/* Links */}
                    <div style={{ marginBottom: 16 }}>
                        <a
                            href="#"
                            style={{
                                fontWeight: 600,
                                color: "#111",
                                textDecoration: "none",
                                display: "block",
                                marginBottom: 6,
                            }}
                        >
                            Register
                        </a>
                        <a
                            href="#"
                            style={{
                                fontSize: 14,
                                color: "#666",
                                textDecoration: "none",
                            }}
                        >
                            Forgot Password
                        </a>
                    </div>

                    {/* Continue as Guest */}
                    <button
                        onClick={() => navigate("/map")}
                        style={{
                            width: "100%",
                            padding: 12,
                            backgroundColor: "#eee",
                            color: "#666",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 16,
                            fontWeight: 500,
                        }}
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}
