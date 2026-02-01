import { useEffect, useState } from "react";
import { getBookmarks, removeBookmark, addBookmark } from "../utils/bookmarks";
import { useNavigate } from "react-router-dom";

export default function Bookmarks() {
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        setBookmarks(getBookmarks());
    }, []);

    function handleRemove(id) {
        removeBookmark(id);
        setBookmarks(getBookmarks());
    }

    function handleAddFromHistory(name) {
        addBookmark({
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            description: "Added from history"
        });
        setBookmarks(getBookmarks());
    }
    const navigate = useNavigate();

    const recent = [
        "BUS Stop – Highland St",
        "Eagle Point Parking",
        "Gateway Center",
    ];

    return (
        // PAGE STARTS HERE
        <div className="page">
            {/*  This wrapper centers and constrains to phone size */}
            <div className="container phone-demo">
                <div className="phone-card" style={{ padding: 16 }}>
                    <h2 className="h2" style={{ marginBottom: 12 }}>Bookmarks</h2>

                    <div className="panel" style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <button className="btn-primary btn" style={{ width: "auto" }}>
                                + New Bookmark
                            </button>
                            <button className="btn" style={{ width: "auto" }}>Import</button>
                        </div>

                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {bookmarks.length === 0 && (
                                <li style={{ padding: "10px 0", color: "var(--muted)" }}>
                                    No bookmarks saved yet.
                                </li>
                            )}

                            {bookmarks.map((b) => (
                                <li
                                    key={b.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 0",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                                        <div style={{ color: "var(--muted)", fontSize: 14 }}>
                                            {b.description}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            className="btn"
                                            style={{ width: "auto" }}
                                            onClick={() =>
                                                navigate("/map", {
                                                    state: {
                                                        lat: b.lat,
                                                        lon: b.lon,
                                                        name: b.name,
                                                    },
                                                })
                                            }
                                        >
                                            Open
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ width: "auto" }}
                                            onClick={() => handleRemove(b.id)}
                                        >
                                            Remove
                                        </button>

                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <h2 className="h2" style={{ marginTop: 20, marginBottom: 12 }}>
                        History
                    </h2>
                    <div className="panel">
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {recent.map((r, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 0",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <span>{r}</span>
                                    <button
                                        className="btn"
                                        style={{ width: "auto" }}
                                        onClick={() => handleAddFromHistory(r)}
                                    >
                                        Bookmark
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
