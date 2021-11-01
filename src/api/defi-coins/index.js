const express = require('express')
const controller = require('./defi-coins.controller')
const { validateCoins } = require('./defi-coins.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/defi-coins List defi-coins
 * @apiDescription Get a list of defi-coins
 * @apiVersion 1.0.0
 * @apiGroup DefiCoins
 *
 * @apiSuccess  {String}    coin.uid                Coin's uid
 * @apiSuccess  {String}    [coin.tvl]              Coin's tvl
 * @apiSuccess  {Number}    [coin.tvl_rank]         Coin's tvl rank
 * @apiSuccess  {String}    [coin.tvl_change_1d]    Coin's daily tvl change percentage
 * @apiSuccess  {String}    [coin.tvl_change_7d]    Coin's weekly tvl change percentage
 * @apiSuccess  {String}    [coin.tvl_change_30d]   Coin's monthly tvl change percentage
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "aave",
 *    "chains": ["Ethereum", "Polygon"],
 *    "tvl": "16721109202.863",
 *    "tvl_rank": 1,
 *    "tvl_change_1d": "2.871",
 *    "tvl_change_7d": "0.434",
 *    "tvl_change_30d": "0.042",
 *  }]
 */
router.get('/', validateCoins, setCurrencyRate, controller.index)

module.exports = router
