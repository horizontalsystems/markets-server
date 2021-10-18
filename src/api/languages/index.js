const express = require('express')
const controller = require('./languages.controller')

const router = express.Router()

/**
 * @apiDefine Languages
 * @apiParam  {String=en,de,es,fa,fr,ko,ru,tr,zh} [language=en] Language code
 */

/**
 * @api {get} /v1/languages List languages
 * @apiDescription Get a list of languages
 * @apiVersion 1.0.0
 * @apiGroup Language
 *
 * @apiSuccess  {String}  language.code     Language's code
 * @apiSuccess  {String}  language.name     Language's name
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "code": "en",
 *    "name": "English"
 *  }]
 */
router.get('/', controller.index)

module.exports = router
