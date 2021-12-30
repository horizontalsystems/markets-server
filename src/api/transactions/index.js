const express = require('express')
const controller = require('./transactions.controller')
const { validateTransactions } = require('./transactions.validator')
const { setDateInterval } = require('../middlewares')

const router = express.Router()

/**
 * @api {get} /v1/transactions List transactions stats
 * @apiDescription Get a list of transactions stats
 * @apiVersion 1.0.0
 * @apiGroup Transaction
 *
 * @apiParam    {String}                    coin_uid    Coin's uid
 * @apiParam    {String=1d,7d,30d}          [interval]  Date interval
 * @apiParam    {String=erc20,bep20,solana} [platform]  Platforms
 *
 * @apiSuccess  {String}    date       date
 * @apiSuccess  {String}    count      count
 * @apiSuccess  {Date}      volume     volume
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    platforms: ['erc20'],
 *    transactions: [{
 *      "date": "2021-10-04T00:00:00.000Z",
 *      count": "1679",
 *      volume": "534523487983"
 *    }
 *  }]
 *
 */

router.get('/', validateTransactions, setDateInterval, controller.index)

module.exports = router
