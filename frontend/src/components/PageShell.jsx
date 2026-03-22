// src/components/PageShell.jsx
export default function PageShell({ title, subtitle, right, children }) {
    return (
        <div className="page">
            <div className="container">
                <header className="pageHeader">
                    <div className="pageHeaderText">
                        {title && <h1 className="pageTitle">{title}</h1>}
                        {subtitle && <p className="pageSubtitle">{subtitle}</p>}
                    </div>
                    {right && <div className="pageHeaderRight">{right}</div>}
                </header>

                <section className="card card--padded">{children}</section>
            </div>
        </div>
    );
}