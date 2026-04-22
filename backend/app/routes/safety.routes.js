const express = require("express");
const router = express.Router();
const controller = require("../controllers/safety.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     WellLitPath:
 *       type: object
 *       properties:
 *         path_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         path_type:
 *           type: string
 *         lighting_level:
 *           type: string
 *         is_preferred:
 *           type: boolean
 *         notes:
 *           type: string
 *           nullable: true
 *         geometry:
 *           type: object
 *     WellLitPathFeatureCollection:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         features:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * /api/safety/well-lit-paths:
 *   get:
 *     summary: Get well-lit walking path segments
 *     tags:
 *       - Safety
 *     parameters:
 *       - in: query
 *         name: preferred
 *         schema:
 *           type: boolean
 *         description: Filter preferred path segments only
 *       - in: query
 *         name: lighting_level
 *         schema:
 *           type: string
 *           enum: [GOOD, MODERATE, LIMITED]
 *       - in: query
 *         name: path_type
 *         schema:
 *           type: string
 *           enum: [SIDEWALK, STREET, CROSSWALK, TRAIL, OTHER]
 *     responses:
 *       200:
 *         description: Well-lit path segments retrieved
 *       400:
 *         description: Invalid query parameter value
 */
router.get("/well-lit-paths", controller.getWellLitPaths);

module.exports = router;
