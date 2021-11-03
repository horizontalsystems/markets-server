const express = require('express')
const controller = require('./funds.controller')
const { validateTreasuries, validateInvestments } = require('./funds.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/funds/treasuries List coin treasuries
 * @apiDescription Get a list of coin treasuries
 * @apiVersion 1.0.0
 * @apiGroup Fund
 *
 * @apiParam  {String=bitcoin,ethereum,...}   coin_uid        Coin's uid
 * @apiUse    Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "type": "public",
 *    "name": "AAA fund",
 *    "amount": "200000",
 *    "amountInCurrency": "200000000",
 *    "country": "AI"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/treasuries', validateTreasuries, setCurrencyRate, controller.treasuries)

/**
 * @api {get} /v1/funds/investments List funds invested
 * @apiDescription Get a list of investments of coin
 * @apiVersion 1.0.0
 * @apiGroup Fund
 *
 * @apiParam  {String=bitcoin,ethereum,...}   coin_uid        Coin's uid
 * @apiUse    Currencies
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "date": "2021-10-02",
 *    "round": "Venture Round",
 *    "amount": "20003003",
 *    "amountInCurrency": "200000000",
 *    "funds": [{
 *       "name": "ABC fund",
 *       "website": "https://domain.com/abc",
 *       "is_lead": true
 *     }]
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.get('/investments', validateInvestments, setCurrencyRate, controller.investments)

module.exports = router
