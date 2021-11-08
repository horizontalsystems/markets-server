const express = require('express')
const controller = require('./defi-coins.controller')
const { validateCoins, validateTvls } = require('./defi-coins.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/defi-coins List defi-coins
 * @apiDescription Get a list of defi-coins
 * @apiVersion 1.0.0
 * @apiGroup DefiCoins
 *
 * @apiUse    Currencies
 *
 * @apiSuccess  {String}    coin.name               Coin's name
 * @apiSuccess  {String}    coin.logo               Coin's logo
 * @apiSuccess  {String}    [coin.uid]              Coin's uid
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
 *    "name": "aave",
 *    "logo": "https://domain.com/aave.png",
 *    "chains": ["Ethereum", "Polygon"],
 *    "tvl": "16721109202.863",
 *    "tvl_rank": 1,
 *    "tvl_change_1d": "2.871",
 *    "tvl_change_7d": "0.434",
 *    "tvl_change_30d": "0.042",
 *  }]
 */
router.get('/', validateCoins, setCurrencyRate, controller.index)

/**
 * @api {get} /v1/defi-coins/:uid/tvls Get coin tvls
 * @apiDescription Get coin's tvl chart
 * @apiVersion 1.0.0
 * @apiGroup DefiCoins
 *
 * @apiParam    {String}            uid         Coin's uid
 * @apiParam    {String=1d,7d,30d}  interval    Date interval
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "date": "2021-10-07T00:00:00.000Z",
 *    "tvl": "15697082453.267897"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/tvls', validateTvls, setCurrencyRate, controller.tvls)

module.exports = router
