const express = require('express')
const controller = require('./blockchains.controller')
const { validateBlockNumber, validateHashes } = require('./blockchains.validator')

const router = express.Router()

/**
 * @api {get} /v1/blockchains/list Blockchains list
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
 * @api {get} /v1/blockchains/:blockchain/block-number Blockchain block number
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
router.get('/:blockchain', validateBlockNumber, controller.blockNumber)
router.get('/:blockchain/block-number', validateBlockNumber, controller.blockNumber)

/**
 * @api {get} /v1/blockchains/:blockchain/hashes Blockchain block hashes
 * @apiDescription Get a block hashes for specific chain with block number
 * @apiVersion 1.0.0
 * @apiGroup Chain
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [
 *    {
 *      "number": 604338,
 *      "hash": "0000000000000000000238670cb83a52d833baeab18bb5173e77d8c1fd0cb0c1"
 *    }
 *  ]
 */
router.get('/:blockchain/hashes', validateHashes, controller.blockHashes)

module.exports = router
