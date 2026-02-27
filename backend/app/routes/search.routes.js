const express = require("express");
const router = express.Router();
const controller = require("../controllers/search.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         result_type:
 *           type: string
 *           enum: [location, poi]
 *         result_id:
 *           type: string
 *         location_id:
 *           type: string
 *           nullable: true
 *         poi_id:
 *           type: string
 *           nullable: true
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         category:
 *           type: string
 *           nullable: true
 *         coordinates:
 *           type: object
 *           nullable: true
 *         share_url:
 *           type: string
 *           nullable: true
 *         match_score:
 *           type: integer
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Federated search across locations and POIs
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query text
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Comma-separated search domains (`location`, `poi`). Defaults to both.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max results to return (default 20, max 50)
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 types:
 *                   type: array
 *                   items:
 *                     type: string
 *                 count:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResult'
 *       400:
 *         description: Invalid query parameters
 */
router.get("/", controller.search);

module.exports = router;
