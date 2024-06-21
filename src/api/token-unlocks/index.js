const express = require('express')
const controller = require('./token-unlocks.controller')
const { validateDates } = require('./token-unlocks.validator')

const router = express.Router()

/**
 * @api {GET} /v1/token-unlocks Token unlocks
 * @apiDescription Token unlock events
 * @apiVersion 1.0.0
 * @apiGroup Unlock
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "dappradar",
 *    "date": "2024-06-13T00:00:00.000Z",
 *    "locked": "4731431000",
 *    "locked_percent": "47.31431",
 *    "unlocked": "4367360750",
 *    "unlocked_percent": "43.6736075",
 *    "next_unlock_percent": "16.44781469563678",
 *    "next_unlock": [{
 *      "date": "2024-06-13T00:00:00.000Z",
 *      "tokens": 65560000.00000001,
 *      "allocationName": "Community",
 *      "allocationTokens": 4000000000
 *    }]
 *  }]
 */
router.get('/', controller.index)

/**
 * @api {GET} /v1/token-unlocks/upcoming Token upcoming unlocks
 * @apiDescription Token upcoming unlocks
 * @apiVersion 1.0.0
 * @apiGroup Unlock
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "uid": "dappradar",
 *    "date": "2024-06-13T00:00:00.000Z",
 *  }]
 */
router.get('/upcoming', validateDates, controller.upcoming)

module.exports = router
