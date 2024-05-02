const express = require('express')
const controller = require('./top-chains.controller')
const { validateChart } = require('./top-chains.validator')
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
router.get('/:chain/list', setCurrencyRate, controller.chainProtocols)

/**
 * @api {get} /v1/top-platforms/:chain/chart Platforms market chart
 * @apiDescription Get platform's chart
 * @apiVersion 1.0.1
 * @apiGroup Platform
 *
 * @apiParam    {String}              chain       Uid of Chain
 * @apiParam    {String=1d,1w,1m,3m}  [interval]  Date interval
 * @apiUse  Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1650434400,
 *    "market_cap": "336612366001"
 *  }]
 *
 */
router.get('/:chain/chart', setCurrencyRate, setDateInterval, controller.chart)

/**
 * @api {get} /v1/top-platforms/:chain/market_chart Platforms market cap chart
 * @apiDescription Get platform's market cap chart
 * @apiVersion 1.0.1
 * @apiGroup Platform
 *
 * @apiParam    {String}                  chain           Uid of Chain
 * @apiParam    {Number}                  from_timestamp  Timestamp
 * @apiParam    {String=30m,1h,4h,8h,1d}  [interval]      Date interval
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1700265600,
 *    "market_cap": "164604366159.14374"
 *  }]
 */
router.get('/:chain/market_chart', validateChart, setCurrencyRate, setDateInterval, controller.marketChart)

/**
 * @api {get} /v1/top-platforms/:chain/market_chart_start Get the date of the first point.
 * @apiDescription Get the date of the first point.
 * @apiVersion 1.0.0
 * @apiGroup Platform
 *
 * @apiParam    {String}                   uid             Coin's uid
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "timestamp": 1641945600
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/:chain/market_chart_start', controller.marketChartStart)

module.exports = router
