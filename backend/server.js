const express = require("express");
const cors = require("cors");
const db = require("./app/models/index");
const app = express();

const authRoutes = require('./app/routes/auth.routes');

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Hello!" })
});

db.sequelize.authenticate();
app.listen(4000, () => {
    console.log(`server is running on port 4000.`);
});