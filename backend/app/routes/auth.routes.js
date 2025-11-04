const express = require('express');
const router = new express.Router();
const controller = require("../controllers/auth.controller");
const middleware = require("../middleware/auth.middleware");


router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", middleware.verifyToken, controller.logout);
router.post("/refresh", controller.refreshToken);

module.exports = router;