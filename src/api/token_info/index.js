const express = require('express')
const controller = require('./token_info.controller')

const router = express.Router()

/**
 * @api {get} /v1/token_info/:platform Get Token info
 * @apiDescription Get Token information
 * @apiVersion 1.0.0
 * @apiGroup Token
 *
 * @apiParam  {String=erc20,bep20,bep2}    platform  Coin's platform
 * @apiParam  {String}                  address   Coin's contract address
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "decimals": 18,
 *    "name": "Super Token",
 *    "symbol": "SUP"
 *  }]
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Not found
 */

router.get('/:type', controller.info)

module.exports = router
