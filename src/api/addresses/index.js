const express = require('express')
const controller = require('./addresses.controller')
const { validateAddresses, validateHolders, validateAddressCoins } = require('./addresses.validator')
const { setDateInterval } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/addresses List addresses
 * @apiDescription Get a list of addresses
 * @apiVersion 1.0.0
 * @apiGroup Address
 *
 * @apiParam  {String=bitcoin,ethereum,...}   coin_uid        Coin's uid
 * @apiParam  {String=1d,1w,2w,1m,3m,6m,1y}   [interval]      Date interval
 *
 * @apiSuccess  {String}    date       date
 * @apiSuccess  {String}    count      count
 * @apiSuccess  {Date}      volume     volume
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "date": "2021-10-04T00:00:00.000Z",
 *    "count": "1679",
 *    "volume": "5345234.554566495"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/', validateAddresses, setDateInterval, controller.index)

/**
 * @api {get} /v1/addresses/holders List coin holders
 * @apiDescription Get a list of coin holders
 * @apiVersion 1.0.0
 * @apiGroup Address
 *
 * @apiParam  {String=bitcoin,ethereum,...}                             coin_uid  Coin's uid
 * @apiParam  {String=ethereum,binance-smart-chain,solana}  platform  Coin's platform
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/holders', validateHolders, controller.holders)

/**
 * @api {get} /v1/addresses/labels List coin labels
 * @apiDescription Get a list of coin labels
 * @apiVersion 1.0.0
 * @apiGroup Address
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/labels', controller.labels)

/**
 * @api {get} /v1/addresses/:address/coins List coins for the account address
 * @apiDescription Get a list of coin holders
 * @apiVersion 1.0.0
 * @apiGroup Address
 *
 * @apiParam  {String=0x...}                                    address   Account address
 * @apiParam  {String=ethereum,binance-smart-chain,polygon-pos} chain     Address's chain
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/:address/coins', validateAddressCoins, controller.coins)

module.exports = router
