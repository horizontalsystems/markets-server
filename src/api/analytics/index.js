const express = require('express')
const controller = require('./analytics.controller')
const { setCurrencyRate, requireCoin, setDailyInterval } = require('../middlewares')
const {
  validateRanks,
  validateShow,
  validatePreview,
  validateHolders,
  validateIssues,
  validateDexData,
  validateSubscriptions
} = require('./analytics.validator')

const router = express.Router()

/**
 * @api {get} /v1/analytics/:uid/ranks Ranks list
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}                                                                           uid   Coin's uid
 * @apiParam    {String=cex_volume,dex_volume,dex_liquidity,tx_count,revenue,fee,address,holders}  type  Rank type
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [
 *    {
 *      "uid": "abc",
 *      "value_7d": "1",
 *      "value_30d": "2"
 *    },
 *    {
 *      "uid": "ethereum-name-service",
 *      "value_7d": "3",
 *      "value_30d": "4"
 *    }
 *  ]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/ranks', validateRanks, controller.ranks)

/**
 * @api {get} /v1/analytics/subscriptions Get active subscriptions
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam  {String}  address Address/list of addresses separated by ","
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "address": "0xcd3b766ccdd6ae721141f452c550ca635964ce71",
 *    "deadline": 1703321010
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/subscriptions', validateSubscriptions, controller.subscriptions)

/**
 * @api {get} /v1/analytics/:uid Analytics data
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}      uid               Coin's uid
 * @apiHeader   {String}      authorization     Json web token
 * @apiUse      Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "cex_volume": {
 *      "rank_30d": 4,
 *      "rating": "excellent",
 *      "points": [{
 *        "timestamp": 1684713600,
 *        "volume": "5027162372"
 *      }]
 *    },
 *    "addresses": {
 *      "rank_30d": 4,
 *      "count_30d": 773949,
 *      "rating": "excellent",
 *      "points": [{
 *        "timestamp": 1684713600,
 *        "count": "38206"
 *      }]
 *    },
 *    "transactions": {
 *      "rank_30d": 3,
 *      "volume_30d": "30616819.049246748625",
 *      "rating": "excellent",
 *      "points": [{
 *        "timestamp": 1684713600,
 *        "count": "397596"
 *      }]
 *    },
 *    "revenue": {
 *      "rank_30d": 1,
 *      "value_30d": "64166548.951023415",
 *      "description": "Percentage of swap fees going to treasury and/or token holders"
 *    },
 *    "fee": {
 *      "rank_30d": 1,
 *      "value_30d": "205234313.29572377",
 *      "description": "Fees collected by sequencer paid by users"
 *    },
 *    "reports": 20,
 *    "funds_invested": "18400000",
 *    "holders_rank": 2,
 *    "holders_rating": "good",
 *    "holders": [
 *      {
 *        "blockchain_uid": "ethereum",
 *        "holders_count": "224890554"
 *      }
 *    ],
 *    "issues": {
 *      "blockchain": "binance-smart-chain",
 *      "issues": [{
 *        "issue": "core",
 *        "description": "No vulnerable withdrawal functions found",
 *        "issues": [{
 *          "impact": "Informational",
 *          "description": "..."
 *        }]
 *      }]
 *    },
 *    "audits": [
 *      "date": "2021-10-11",
 *      "name": "Smart contracts",
 *      "audit_url": "https://files.safe.de.fi/safe/files/audit/pdf/Afrostar_Full_Smart_Contract_Security_Audit_1.pdf",
 *      "audit_link": "safe/files/audit/pdf/Afrostar_Full_Smart_Contract_Security_Audit_1.pdf",
 *      "tech_issues": 2,
 *      "tech_issues_low": null,
 *      "tech_issues_high": null,
 *      "tech_issues_medium": null
 *    ],
 *    "indicators": {
 *      "rsi": 76.53,
 *      "macd": 102.72535365629665,
 *      "lower": 33384.407100956756,
 *      "price": 41663,
 *      "upper": 39520.19289904325,
 *      "middle": 36452.3,
 *      "timestamp": 1702339200,
 *      "state": "overbought",
 *      "signal_timestamp": null
 *    }
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid', validateShow, setCurrencyRate, setDailyInterval, controller.show)

/**
 * @api {get} /v1/analytics/:uid/preview Analytics preview
 * @apiDescription Analytics preview
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}    uid       Coin's uid
 * @apiQuery    {String}    address   Address/list of addresses divided by ","
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    subscriptions: [{
 *      address: 'abc',
 *      deadline: 123453388,
 *    }]
 *    cex_volume: {
 *      rank_30d: true,
 *      rating: true,
 *      points: true
 *    },
 *    dex_volume: {
 *      rank_30d: true,
 *      rating: true,
 *      points: true
 *    }
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/preview', validatePreview, controller.preview)

/**
 * @api {get} /v1/analytics/:uid/holders Address holders
 * @apiDescription Major holders
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}    uid               Coin's uid
 * @apiQuery    {String}    blockchain_uid    Blockchain uid
 * @apiHeader   {String}    authorization     Json web token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    count: 0,
 *    holders_url: '',
 *    top_holders: [{
 *      address: '',
 *      balance: 10,
 *      percentage: 10,
 *    }]
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 401)    Unauthorized      Unauthorized
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/holders', validateHolders, controller.holders)

/**
 * @api {get} /v1/analytics/:uid/issues Address issues
 * @apiDescription Major issues
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}    uid               Coin's uid
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "chain": "binance-smart-chain",
 *    "issues": [{
 *       "issue": "core",
 *       "description": "No vulnerable withdrawal functions found"
 *    }]
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/issues', validateIssues, controller.issues)

/**
 * @api {get} /v1/analytics/:uid/addresses Address stats
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}                        uid             Coin's uid
 * @apiParam    {String=1w,2w,1m,3m,6m,1y,all}  [interval]      Date interval
 * @apiHeader   {String}                        authorization   Json web token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1677110400,
 *    "count": "945"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 401)    Unauthorized      Invalid JWT
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/addresses', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.addresses)

/**
 * @api {get} /v1/analytics/:uid/transactions Transactions stats
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}                        uid             Coin's uid
 * @apiParam    {String=1w,2w,1m,3m,6m,1y,all}  [interval]      Date interval
 * @apiHeader   {String}                        authorization   Json web token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1677110400,
 *    "count": "1569",
 *    "volume": "2818300.57978228"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 401)    Unauthorized      Invalid JWT
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/transactions', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.transactions)

/**
 * @api {get} /v1/analytics/:uid/dex-volumes Dex volumes
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}                        uid             Coin's uid
 * @apiParam    {String=1w,2w,1m,3m,6m,1y,all}  [interval]      Date interval
 * @apiHeader   {String}                        authorization   Json web token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1677110400,
 *    "volume": "2818300.57978228"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 401)    Unauthorized      Invalid JWT
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/dex-volumes', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.dexVolumes)

/**
 * @api {get} /v1/analytics/:uid/dex-liquidity Dex liquidity stats
 * @apiVersion 1.0.0
 * @apiGroup Analytics
 *
 * @apiParam    {String}                        uid             Coin's uid
 * @apiParam    {String=1w,2w,1m,3m,6m,1y,all}  [interval]      Date interval
 * @apiHeader   {String}                        authorization   Json web token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "timestamp": 1677110400,
 *    "volume": "2818300.57978228"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 401)    Unauthorized      Invalid JWT
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/:uid/dex-liquidity', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.dexLiquidity)

module.exports = router
