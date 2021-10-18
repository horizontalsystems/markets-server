const express = require('express')
const controller = require('./categories.controller')
const { setCurrencyRate } = require('../middlewares')

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
 *    "name": "Blockchains"
 *    "description": {
 *      "en": "..."
 *    }
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 */
router.get('/', controller.index)

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
 *    "total_volume": "439960308849"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Category does not exist
 */
router.get('/:uid/coins', setCurrencyRate, controller.index)

module.exports = router
