const express = require('express')
const controller = require('./top-chains.controller')
const { setDateInterval, setCurrencyRate } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/top-platforms List Top Platforms stats
 * @apiDescription Get a list of top platforms stats
 * @apiVersion 1.0.0
 * @apiGroup Platform
 *
 * @apiUse  Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "name": "ethereum",
 *    "market_cap": "336612366001.57",
 *    "rank": "1",
 *    "stats": {
 *       "rank_1d": "1",
 *       "rank_1w": "1.2",
 *       "rank_1m": "1.5",
 *       "change_1d": "1.31",
 *       "change_1m": "1.45",
 *       "change_1w": "1.45",
 *       "protocols": "2231"
 *    }
 *  }]
 */
router.get('/', setCurrencyRate, controller.index)

/**
 * @api {get} /v1/top-platforms/:chain/list List Top Platforms
 * @apiDescription Get a list of top platforms
 * @apiVersion 1.0.0
 * @apiGroup Platform
 *
 * @apiUse  Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "usd-coin",
 *    "price": "1.004",
 *    "price_change_24h": "-0.07",
 *    "market_cap": "45765651521",
 *    "market_cap_rank": 4,
 *    "total_volume": "5923465567"
 *  }]
 */
router.get('/:chain/list', setCurrencyRate, controller.protocols)

/**
 * @api {get} /v1/top-platforms/:chain/chart List market cap chart
 * @apiDescription Get a list of market cap chart
 * @apiVersion 1.0.1
 * @apiGroup Platform
 *
 * @apiParam    {String}            chain       Chain
 * @apiParam    {String=1d,1w,1m}   [interval]  Date interval
 * @apiUse  Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "date": 1650434400,
 *    "market_cap": "336612366001"
 *  }]
 *
 */
router.get('/:chain/chart', setCurrencyRate, setDateInterval, controller.chart)

module.exports = router
