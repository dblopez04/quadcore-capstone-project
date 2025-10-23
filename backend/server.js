const express = require("express");
const cors = require("cors");
const db = require("./app/models/index");


const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/", (req, res) => {
    res.json({ message: "Hello!" })
});

db.sequelize.authenticate();
app.listen(4000, () => {
    console.log(`server is running on port 4000.`);
});