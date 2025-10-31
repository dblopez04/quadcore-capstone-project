const express = require('express');
const router = new express.Router();
const controller = require("../controllers/auth.controller");


router.post("/register", controller.register);

/** 
 * @swagger
 * /api/auth/login:
 *   get:
 *     description: Login functionality
 *     responses:
 *          200:
 *              description: Just testing to see how swagger works, I'll  this in after work
*/
router.post("/login", controller.login);

module.exports = router;