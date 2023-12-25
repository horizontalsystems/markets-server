const express = require('express')
const controller = require('./platforms.controller')

const router = express.Router()

/**
 * @api {get} /v1/tokens Tokens
 * @apiDescription Get platforms
 * @apiVersion 1.0.0
 * @apiGroup Token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "type": "native",
 *    "coin_uid": "bitcoin",
 *    "blockchain_uid": "bitcoin",
 *    "decimals": 8
 *  }]
 */
router.get('/list', controller.list)

module.exports = router
