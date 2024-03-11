const express = require('express')
const controller = require('./stats.controller')

const router = express.Router()

/**
 * @api {head} /v1/stats Pass page stats
 * @apiDescription Pass page stats
 * @apiVersion 1.0.0
 * @apiGroup Stats
 *
 * @apiParam  {String}  tag_name        Tag name
 * @apiParam  {String}  [tag_type]      Tag type
 * @apiParam  {String}  [tag_parent]    Tag parent
 * @apiParam  {String}  [tag_from]      Tag from
 * @apiParam  {String}  [coin_uid]      Coin UID
 * @apiParam  {String}  [oscillators]   Oscillators
 * @apiParam  {String}  [ma]            Moving averages
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {}
 */
router.head('/', controller.analytics)

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
