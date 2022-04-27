const express = require('express')
const controller = require('./evm-method-labels.controller')

const router = express.Router()

/**
 * @api {get} /v1/evm-method-labels List EVM method labels
 * @apiDescription Get a list of EVM method labels
 * @apiVersion 1.0.0
 * @apiGroup EvmMethodLabels
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "method_id": "0xa9059cbb",
 *    "label": "abc"
 *  }]
 */
router.get('/', controller.index)

module.exports = router
