const express = require('express')
const controller = require('./stats.controller')

const router = express.Router()

/**
 * @api {POST} /v1/stats Page stats
 * @apiDescription Page stats
 * @apiVersion 1.0.0
 * @apiGroup Stats
 *
 * @apiParam  {String}  event       Event name
 * @apiParam  {String}  event_page  Event page
 * @apiParam  {String}  [page]      Page
 * @apiParam  {String}  [tab]       tab
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {}
 */
router.post('/', controller.stats)

/**
 * @api {get} /v1/stats/popular-coins Get popular coins
 * @apiDescription Get popular coins
 * @apiVersion 1.0.0
 * @apiGroup Stats
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "fantom",
 *    "count": 1000,
 *    "unique": 100
 *  }]
 */
router.get('/popular-coins', controller.popularCoins)

/**
 * @api {get} /v1/stats/popular-resources Get popular resources
 * @apiDescription Get popular resources
 * @apiVersion 1.0.0
 * @apiGroup Stats
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "coin_prices",
 *    "count": 1000,
 *    "unique": 100
 *  }]
 */
router.get('/popular-resources', controller.popularResources)

module.exports = router
