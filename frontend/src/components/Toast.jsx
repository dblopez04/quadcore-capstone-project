import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => onClose?.(), 2500);
        return () => clearTimeout(t);
    }, [message, onClose]);

    if (!message) return null;

    const bg =
        type === "success"
            ? "#e9f7ef"
            : type === "error"
                ? "#fdecea"
                : "#eef2ff";

    const border =
        type === "success"
            ? "#b7e4c7"
            : type === "error"
                ? "#f5c2c7"
                : "#c7d2fe";

    const text =
        type === "success"
            ? "#1b4332"
            : type === "error"
                ? "#7f1d1d"
                : "#1e3a8a";

    return (
        <div
            style={{
                position: "fixed",
                bottom: 18,
                right: 18,
                zIndex: 9999,
                background: bg,
                border: `1px solid ${border}`,
                color: text,
                padding: "10px 12px",
                borderRadius: 10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                minWidth: 220,
                maxWidth: 340,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 14,
            }}
            role="status"
            aria-live="polite"
        >
            <span style={{ lineHeight: 1.3 }}>{message}</span>
            <button
                onClick={() => onClose?.()}
                style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                    color: text,
                }}
                aria-label="Close toast"
                type="button"
            >
                ×
            </button>
        </div>
    );
}