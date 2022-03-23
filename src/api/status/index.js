const express = require('express')
const controller = require('./status.controller')

const router = express.Router()

/**
 * @api {get} /v1/status API status
 * @apiDescription Get status
 * @apiVersion 1.0.0
 * @apiGroup Status
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "code": 200,
 *    "stats": "ok"
 *  }
 */
router.get('/', controller.index)

/**
 * @api {get} /v1/status/updates Update dates
 * @apiDescription Get update dates
 * @apiVersion 1.0.0
 * @apiGroup Status
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "coins": 1648009987,
 *    "platforms": 1648009987
 *  }
 */
router.get('/updates', controller.updates)

module.exports = router
