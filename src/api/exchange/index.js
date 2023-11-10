const express = require('express')
const controller = require('./exchange.controller')

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
 * @api {get} /v1/exchanges List of whitelisted exchanges
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
