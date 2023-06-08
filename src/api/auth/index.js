const express = require('express')
const controller = require('./auth.controller')
const { validateAuthenticate, validateAuthKey } = require('./auth.validator')

const router = express.Router()

/**
 * @api {get} /v1/auth/get-key Get auth key
 * @apiDescription Get a random key for signature
 * @apiVersion 1.0.0
 * @apiGroup Auth
 *
 * @apiParam    {String}  address Wallet address
 *
 * @apiSuccess  {String}  key Random key
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "key": "abc"
 *  }
 */
router.get('/get-key', validateAuthKey, controller.generateKey)

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
