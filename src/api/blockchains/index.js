const express = require('express')
const controller = require('./blockchains.controller')

const router = express.Router()

/**
 * @api {get} /v1/blockchains Blockchains list
 * @apiDescription Get a blockchains list
 * @apiVersion 1.0.0
 * @apiGroup Chain
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {[
 *    "uid": "bitcoin",
 *    "name: "Bitcoin"
 *  ]}
 */
router.get('/list', controller.list)

/**
 * @api {get} /v1/blockchains/:chain Blockchain block number
 * @apiDescription Get a block number for specific chain
 * @apiVersion 1.0.0
 * @apiGroup Chain
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "block_number": "123456",
 *  }
 */
router.get('/:chain', controller.blockNumber)

module.exports = router
