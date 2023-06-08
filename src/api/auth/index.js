const express = require('express')
const controller = require('./auth.controller')
const { validateAuthenticate, validateSignMessage } = require('./auth.validator')

const router = express.Router()

/**
 * @api {get} /v1/auth/get-sign-message Get sign message
 * @apiDescription Get a sign message for signature
 * @apiVersion 1.0.0
 * @apiGroup Auth
 *
 * @apiParam    {String}  address Wallet address
 *
 * @apiSuccess  {String}  message Text
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "message": "Message"
 *  }
 */
router.get('/get-sign-message', validateSignMessage, controller.generateMessage)

/**
 * @api {post} /v1/auth/authenticate Authenticate
 * @apiDescription authenticate
 * @apiVersion 1.0.0
 * @apiGroup Auth
 *
 * @apiBody {String}  signature Signature
 * @apiBody {String}  address   Wallet address
 *
 * @apiSuccess  {String}  token JSON Web Token
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "token": "abc"
 *  }
 */
router.post('/authenticate', validateAuthenticate, controller.authenticate)

module.exports = router
module.exports.requireAuth = controller.requireAuth
