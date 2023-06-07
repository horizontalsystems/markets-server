const express = require('express')
const controller = require('./auth.controller')
const { validateAuthenticate, validateAuthKey } = require('./auth.validator')

const router = express.Router()

/**
 * @api {get} /v1/auth/get-eip712-data Get EIP-712 data
 * @apiDescription Get EIP-712 message data
 * @apiVersion 1.0.0
 * @apiGroup Auth
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    types: {
 *      EIP712Domain: [
 *        { name: 'name', type: 'string' },
 *        { name: 'version', type: 'string' },
 *      ],
 *      AccessRequest: [
 *      ]
 *    },
 *    domain: {
 *      name: 'Unstoppable Wallet Premium Subscription',
 *      version: '1',
 *      verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
 *    },
 *    primaryType: 'AccessRequest',
 *    message: {
 *    }
 *  }
 */
router.get('/get-eip712-data', controller.getEip712Data)

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
