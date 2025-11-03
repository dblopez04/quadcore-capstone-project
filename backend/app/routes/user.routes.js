const express = require('express');
const router = new express.Router();
const controller = require("../controllers/user.controller");
const middleware = require("../middleware/auth.middleware");

router.post("/profile", middleware.verifyToken, controller.getProfile);

module.exports = router;