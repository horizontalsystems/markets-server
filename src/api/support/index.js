const express = require('express')
const controller = require('./support.controller')
const { validateChat, validateCreateGroup } = require('./support.validator')

const router = express.Router()

/**
 * @api {post} /v1/support/start-chat Start chat
 * @apiVersion 1.0.0
 * @apiGroup Support
 *
 * @apiParam {String} username Telegram username
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {}
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */
router.post('/start-chat', validateChat, controller.startChat)

/**
 * @api {post} /v1/support/create-group Start Group
 * @apiVersion 1.0.0
 * @apiGroup Support
 *
 * @apiParam {String} subscription_id Subscription uniq id
 * @apiParam {String} subscription_deadline Subscription expire timestamp
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "group_link": "https://t.me/+pXiSh"
 *  }
 *
 * @apiError (Bad Request 400)  ValidationError   Some parameters may contain invalid values
 * @apiError (Not Found 404)    NotFound          Coin does not exist
 */

router.post('/create-group', validateCreateGroup, controller.createGroup)

module.exports = router
