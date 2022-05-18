const express = require('express')
const controller = require('./transactions.controller')
const { requireAuth } = require('../auth')
const { setDateInterval } = require('../middlewares')
const {
  validateTransactions,
  validateDexVolumes,
  validateDexLiquidity
} = require('./transactions.validator')

const router = express.Router()

/**
 * @api {get} /v1/transactions List transactions stats
 * @apiDescription Get a list of transactions stats
 * @apiVersion 1.0.1
 * @apiGroup Transaction
 *
 * @apiParam    {String}                        coin_uid    Coin's uid
 * @apiParam    {String=1d,1w,2w,1m,3m,6m,1y}   [interval]  Date interval
 * @apiParam    {String=erc20,bep20,solana}     [platform]  Platforms
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
 *      "count": "1679",
 *      "volume": "534523487983"
 *    }
 *  }]
 */

router.get('/', requireAuth, validateTransactions, setDateInterval, controller.index)

/**
 * @api {get} /v1/transactions/dex-volumes List dex-volumes
 * @apiDescription Get a list of dex-volumes stats
 * @apiVersion 1.0.1
 * @apiGroup Transaction
 *
 * @apiParam    {String}                        coin_uid    Coin's uid
 * @apiParam    {String=1d,1w,2w,1m,3m,6m,1y}   [interval]  Date interval
 * @apiParam    {String=erc20,bep20,solana}     [platform]  Platforms
 *
 * @apiSuccess  {String}    date       date
 * @apiSuccess  {Date}      volume     volume
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    platforms: ['erc20'],
 *    volumes: [{
 *      "date": "2021-10-04T00:00:00.000Z",
 *      "count": "1679",
 *      "volume": "534523487983"
 *    }
 *  }]
 */

router.get('/dex-volumes', requireAuth, validateDexVolumes, setDateInterval, controller.dexVolume)

/**
 * @api {get} /v1/transactions/dex-liquidity List dex-liquidity
 * @apiDescription Get a list of dex-liquidity stats
 * @apiVersion 1.0.1
 * @apiGroup Transaction
 *
 * @apiParam    {String}                        coin_uid    Coin's uid
 * @apiParam    {String=1d,1w,2w,1m,3m,6m,1y}   [interval]  Date interval
 * @apiParam    {String=erc20,bep20}            [platform]  Platforms
 *
 * @apiSuccess  {String}    date       date
 * @apiSuccess  {Date}      volume     volume
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    platforms: ['erc20'],
 *    liquidity: [{
 *      "date": "2021-10-04T00:00:00.000Z",
 *      "volume": "534523487983"
 *    }
 *  }]
 */

router.get('/dex-liquidity', requireAuth, validateDexLiquidity, setDateInterval, controller.dexLiquidity)

module.exports = router
