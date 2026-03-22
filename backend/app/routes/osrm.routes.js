const express = require("express");
const controller = require("../controllers/osrm.controller");

const router = express.Router();

/**
 * @swagger
 * /api/osrm/route:
 *   get:
 *     summary: Get a walking route from OSRM
 *     tags:
 *       - OSRM
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *         description: Start coordinate in lon,lat format
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *         description: End coordinate in lon,lat format
 *       - in: query
 *         name: profile
 *         required: false
 *         schema:
 *           type: string
 *           enum: [walking, foot]
 *         description: Routing profile supported by the current OSRM dataset
 *     responses:
 *       200:
 *         description: Route retrieved
 *       400:
 *         description: Missing or invalid query parameters
 *       404:
 *         description: No route found
 *       500:
 *         description: OSRM service unavailable
 */
router.get("/route", controller.getRoute);

module.exports = router;
