const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./app/models/index");
const { swaggerUi, swaggerSpec } = require("./app/config/swagger.config");
const PORT = Number(process.env.PORT || 4000);
const DB_CONNECT_MAX_ATTEMPTS = Number(process.env.DB_CONNECT_MAX_ATTEMPTS || 20);
const DB_CONNECT_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 3000);

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = new Set([frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);

app.use(
    cors({
        origin(origin, callback) {
            // Allow non-browser clients and local dev origins.
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true, // allow cookies / auth headers
    })
);
// Access controls for cross-origin requests, prevents XSS
app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: true })); // Parses HTTP forms
app.use(cookieParser()); // I'll let you guess what this one does

const authRoutes = require('./app/routes/auth.routes');
const userRoutes = require("./app/routes/user.routes");
const adminRoutes = require("./app/routes/admin.routes");
const eventRoutes = require("./app/routes/event.routes");
const locationRoutes = require("./app/routes/location.routes");
const searchRoutes = require("./app/routes/search.routes");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/search', searchRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Hello!" })
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function connectDatabaseWithRetry() {
    for (let attempt = 1; attempt <= DB_CONNECT_MAX_ATTEMPTS; attempt += 1) {
        try {
            await db.sequelize.authenticate();
            console.log("Database connection has been established successfully.");
            return;
        } catch (error) {
            const isFinalAttempt = attempt === DB_CONNECT_MAX_ATTEMPTS;
            const message = error?.message || String(error);
            console.error(
                `Database connection attempt ${attempt}/${DB_CONNECT_MAX_ATTEMPTS} failed: ${message}`
            );
            if (isFinalAttempt) {
                throw error;
            }
            await sleep(DB_CONNECT_RETRY_DELAY_MS);
        }
    }
}

async function startServer() {
    try {
        await connectDatabaseWithRetry();
        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}.`);
        });
    } catch (error) {
        console.error("Unable to connect to the database after retries:", error);
        process.exit(1);
    }
}

void startServer();
