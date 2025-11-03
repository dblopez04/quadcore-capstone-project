const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./app/models/index");
const { swaggerUi, swaggerSpec } = require("./app/config/swagger.config");

const authRoutes = require('./app/routes/auth.routes');
const userRoutes = require('./app/routes/user.routes');

app.use(cors()); // Access controls for cross-origin requests, prevents XSS

app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended:true })); // Parses HTTP forms
app.use(cookieParser()); // I'll let you guess what this one does

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Hello!" })
});

db.sequelize.authenticate();
app.listen(4000, () => {
    console.log(`server is running on port 4000.`);
});