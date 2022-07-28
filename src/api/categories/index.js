const express = require('express')
const controller = require('./categories.controller')
const { setCurrencyRate, setDateInterval } = require('../middlewares')
const { validateMarketCap } = require('./categories.validator')

const router = express.Router()

/**
 * @api {get} /v1/categories List categories
 * @apiDescription Get a list of categories
 * @apiVersion 1.0.0
 * @apiGroup Category
 *
 * @apiSuccess  {String}  category.uid             Category's uid
 * @apiSuccess  {String}  category.name            Category's name
 * @apiSuccess  {Object}  category.description     Category's description mapped by language
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "blockchains",
 *    "name": "Blockchains",
 *    "order": 1,
 *    "description": {
 *      "en": "..."
 *    },
 *    "market_cap": "1.0",
 *    "change_24h": "1.0",
 *    "change_1w": "1.0",
 *    "change_1m": "1.0"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/', setCurrencyRate, controller.index)

/**
 * @api {get} /v1/categories/:uid/coins List coins
 * @apiDescription Get category's coins
 * @apiVersion 1.0.0
 * @apiGroup Category
 *
 * @apiParam    {String}        uid   Coin's uid
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "bitcoin",
 *    "price": "100000",
 *    "market_cap": "11334574361987",
 *    "market_cap_rank": 1,
 *    "total_volume": "439960308849"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Category does not exist
 */
router.get('/:uid/coins', setCurrencyRate, controller.coins)

/**
 * @api {get} /v1/categories/:uid/market_cap List market cap stats
 * @apiDescription Get a list of market cap stats
 * @apiVersion 1.0.1
 * @apiGroup Category
 *
 * @apiParam    {String}            uid         Category's uid
 * @apiParam    {String=1d,1w,1m}   [interval]  Date interval
 * @apiUse      Currencies
 *
 */

router.get('/:uid/market_cap', validateMarketCap, setCurrencyRate, setDateInterval, controller.marketCap)

module.exports = router
