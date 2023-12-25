const express = require('express')
const controller = require('./exchange.controller')
const { requireCoin } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/exchanges List of exchanges
 * @apiDescription Get a list of exchanges
 * @apiVersion 1.0.0
 * @apiGroup Exchange
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "binance",
 *    "name": "Binance"
 *  },{
 *    "uid": "gate",
 *    "name": "Gate.io"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */

router.get('/', controller.index)

/**
 * @api {get} /v1/exchanges/tickers/:uid Get coin tickers
 * @apiDescription Get coin tickers
 * @apiVersion 1.0.0
 * @apiGroup Exchange
 *
 * @apiParam    {String}  uid           Coin's uid
 * @apiParam    {Number}  [limit=100]   Tickers per page
 * @apiParam    {Number}  [page=1]      Page number
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "base": "UNI",
 *    "target": "BUSD",
 *    "price": "5.961",
 *    "volume": "3471277",
 *    "volume_usd": "34712774",
 *    "market_uid": "bw",
 *    "market_name": "BW.com",
 *    "market_logo": "https://assets.coingecko.com/markets/images/326/small/bw.com.jpg?1548664400"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/tickers/:uid', requireCoin, controller.tickers)

/**
 * @api {get} /v1/exchanges/whitelist List of whitelisted exchanges
 * @apiDescription Get a list of whitelisted exchanges
 * @apiVersion 1.0.0
 * @apiGroup Exchange
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  ["binance", "gate"]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/whitelist', controller.whitelist)

module.exports = router
