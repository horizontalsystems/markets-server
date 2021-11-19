const express = require('express')
const controller = require('./defi-protocols.controller')
const { validateCoins, validateTvls } = require('./defi-protocols.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/defi-protocols List DeFi protocols
 * @apiDescription Get a list of defi-protocols
 * @apiVersion 1.0.0
 * @apiGroup DefiProtocols
 *
 * @apiUse    Currencies
 *
 * @apiSuccess  {String}    protocol.name               Protocol's name
 * @apiSuccess  {String}    protocol.logo               Protocol's logo
 * @apiSuccess  {String}    [protocol.uid]              Protocol's uid
 * @apiSuccess  {String}    [protocol.tvl]              Protocol's tvl
 * @apiSuccess  {Number}    [protocol.tvl_rank]         Protocol's tvl rank
 * @apiSuccess  {String}    [protocol.tvl_change_1d]    Protocol's daily tvl change percentage
 * @apiSuccess  {String}    [protocol.tvl_change_7d]    Protocol's weekly tvl change percentage
 * @apiSuccess  {String}    [protocol.tvl_change_30d]   Protocol's monthly tvl change percentage
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
 * @api {get} /v1/defi-protocols/:uid/tvls Get coin tvls
 * @apiDescription Get defi-protocol's tvl chart
 * @apiVersion 1.0.0
 * @apiGroup DefiProtocols
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
