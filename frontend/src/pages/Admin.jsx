import { Navigate } from "react-router-dom";
import { isAuthenticatedMode } from "../utils/authMode";
import { isAdminUser, getStoredUser } from "../utils/userSession";

export default function Admin() {
    const isAuthenticated = isAuthenticatedMode();
    const isAdmin = isAdminUser();
    const user = getStoredUser();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        return (
            <div style={{ padding: 24 }}>
                <h2>Access denied</h2>
                <p>You do not have permission to view the admin page.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Admin Panel</h1>
            <p>Welcome, {user?.first_name || "Admin"}.</p>
            <p>This page is only visible to admin users.</p>
        </div>
    );
}