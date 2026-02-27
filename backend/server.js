const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./app/models/index");
const { swaggerUi, swaggerSpec } = require("./app/config/swagger.config");

app.use(
    cors({
        origin: "http://localhost:5173", // your Vite dev server
        credentials: true,              // allow cookies / auth headers
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

db.sequelize.authenticate()
    .then(() => {
        console.log("Database connection has been established successfully.");
        app.listen(4000, () => {
            console.log(`server is running on port 4000.`);
        });
    })
    .catch((err) => {
        console.error("Unable to connect to the database:", err);
    });
