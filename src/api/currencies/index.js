const express = require('express')
const controller = require('./currencies.controller')

const router = express.Router()

/**
 * @apiDefine Currencies
 * @apiParam  {String=usd,eur,gbp,jpy,aud,cad,sgd,brl,chf,cny,hkd,ils,rub,try} [currency=usd] Currency code
 */

/**
 * @api {get} /v1/currencies List currencies
 * @apiDescription Get a list of currencies
 * @apiVersion 1.0.0
 * @apiGroup Currency
 *
 * @apiSuccess  {String}  language.code     Currency's code
 * @apiSuccess  {String}  language.name     Currency's name
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "code": "usd",
 *    "name": "US Dollar"
 *  }]
 */

router.get('/', controller.index)

module.exports = router
