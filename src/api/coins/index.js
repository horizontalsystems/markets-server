const express = require('express')
const controller = require('./coins.controller')
const { validateCoins, validateShow, validateChart, validatePriceHistory, validateGainers } = require('./coins.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/coins List coins
 * @apiDescription Get a list of coins
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam  {String=bitcoin,ethereum,...}   [uids]                  Coin uids separated by comma
 * @apiParam  {String=name,code,price,price_change_[24h/7d/14d,30d/200d/1y],ath_percentage,atl_percentage,market_cap,market_cap_rank,total_volume,platforms,coingecko_id
 *                                        }   [fields]                Coin's fields separated by comma
 * @apiParam  {Number{1-1500}}                [limit=1500]            Coins per page
 * @apiParam  {Number}                        [page=1]                Page number
 * @apiParam  {Boolean}                       [defi=false]            Filter DeFi coins
 * @apiParam  {Boolean}                       [order_by_rank=false]   Filter DeFi coins
 * @apiHeader {String}                        [app_resource]          The resource name of the App
 * @apiHeader {String}                        [app_id]                App id
 * @apiHeader {String}                        [app_platform]          App platform
 * @apiHeader {String}                        [app_version]           App version
 * @apiUse    Currencies
 * @apiUse    Languages
 *
 * @apiSuccess  {String}    coin.uid                Coin's uid
 * @apiSuccess  {String}    [coin.price]            Coin's price
 * @apiSuccess  {Date}      [coin.last_updated]     Updated date
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "bitcoin",
 *    "price": "100000"
 *    "last_updated": "2021-12-12 00:00:00.000+00"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/', validateCoins, setCurrencyRate, controller.index)

router.get('/filter', setCurrencyRate, controller.filter)

/**
 * @api {get} /v1/coins/list Get coins list
 * @apiDescription Get all coins
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiUse    Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "bitcoin",
 *    "code": "btc",
 *    "name": "Bitcoin",
 *    "market_cap_rank": 1,
 *    "coingecko_id": "bitcoin"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/list', setCurrencyRate, controller.list)

/**
 * @api {get} /v1/coins/top-movers Get top movers
 * @apiDescription Get top movers
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "gainers_100": [],
 *    "losers_100": [],
 *    ...
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/top-movers', setCurrencyRate, controller.movers)

/**
 * @api {get} /v1/coins/top-movers-by/:field Get top movers by given field
 * @apiDescription Get top gainers by field
 * @apiVersion 1.0.0
 * @apiGroup Coin
 * @apiParam  {String=price,volume,mcap}      field                Sorting field
 * @apiParam  {String=bitcoin,ethereum,...}   [uids]               Coin uids separated by comma
 * @apiParam  {String=asc,desc}               [order]              Sorting order
 * @apiParam  {Number{3-10}}                  [limit=3]            Limit
 *
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *     "uid": "radix",
 *     "name": "Radix",
 *     "code": "xrd",
 *     "price": "0.04033021",
 *     "price_change_24h": "-8.63228"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/top-movers-by/:field', validateGainers, setCurrencyRate, controller.moversBy)

/**
 * @api {get} /v1/coins/:uid Get coin
 * @apiDescription Get coin information
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam    {String}        uid   Coin's uid
 * @apiUse      Currencies
 * @apiUse      Languages
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "uid": "bitcoin",
 *    "name": "Bitcoin",
 *    "price": "100000",
 *    "code": "btc",
 *    "description": "...",
 *    "price_change": {},
 *    "market_data: {},
 *    "performance: {},
 *    "platforms: {},
 *    "category_uids: []
 *    "categories: [{}]
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid', validateShow, setCurrencyRate, controller.show)

/**
 * @api {get} /v1/coins/:uid/details Get coin details
 * @apiDescription Get coin's detailed information
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam    {String}        uid   Coin's uid
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "uid": "supercoin",
 *    "links": {},
 *    "security": {},
 *    "tvl": 5139343551.541889,
 *    "tvl_rank": 1,
 *    "tvl_ratio": 2.6662951088157687,
 *    "investor_data": {
 *      "funds_invested": "640000000",
 *      "treasuries": "720000000"
 *    }
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/details', setCurrencyRate, controller.details)

/**
 * @api {get} /v1/coins/:uid/twitter Get coin's twitter
 * @apiDescription Get coin's twitter account
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam    {String}        uid   Coin's uid
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "twitter": "supercoin"
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/twitter', controller.twitter)

/**
 * @api {get} /v1/coins/:uid/price_chart Get coin price charts
 * @apiDescription Get coin's historical price chart
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam    {String}                   uid             Coin's uid
 * @apiParam    {Number}                   from_timestamp  Timestamp
 * @apiParam    {String=30m,1h,4h,8h,1d}   [interval]      Date interval
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1641945600,
 *    "price": "43658",
 *    "volume": "4365"
 *   }, {
 *    "timestamp": 1642032000,
 *    "price": "43847",
 *    "volume": "438"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/price_chart', validateChart, setCurrencyRate, controller.price_chart)

/**
 * @api {get} /v1/coins/:uid/price_chart_start Get the date of the first point on the coin's price chart.
 * @apiDescription Get the date of the first point on the coin's price chart.
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam    {String}                   uid             Coin's uid
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "timestamp": 1641945600
 *   }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/price_chart_start', controller.price_chart_start)

/**
 * @api {get} /v1/coins/:uid/price_history Get coin historical price
 * @apiDescription Get coin's historical volume chart
 * @apiVersion 1.0.0
 * @apiGroup Coin
 *
 * @apiParam    {String}  uid         Coin's uid
 * @apiParam    {Number}  timestamp   Unix epoch timestamp
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "date": 1641945600,
 *    "price": "43658"
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/price_history', validatePriceHistory, setCurrencyRate, controller.price_history)

module.exports = router
