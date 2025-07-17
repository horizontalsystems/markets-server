const express = require('express')
const controller = require('./etf.controller')
const { validateEtfAll, validateEtfChart, validateEtfTreasuries } = require('./etf.validator')

const router = express.Router()

/**
 * @api {GET} /v1/etfs ETF list
 * @apiDescription ETF list
 * @apiVersion 1.0.0
 * @apiGroup Etf
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "ticker": "IBIT",
 *    "name": "iShares Bitcoin Trust",
 *    "total_assets": "19260507559.68",
 *    "daily_assets": "752205523.68",
 *    "total_inflow": "15700510023.82",
 *    "daily_inflow": "66350173.68",
 *    "changes": {
 *      "1w_assets": "72780468715.03",
 *      "1w_inflow": "236216414.56",
 *      "1m_assets": "698490442429.23",
 *      "1m_inflow": "2416089550.52",
 *      "3m_assets": "966342589915.23",
 *      "3m_inflow": "10219359399.52"
 *    }
 * }]
 */
router.get('/', controller.index)

router.get('/all', validateEtfAll, controller.all)
router.get('/chart', validateEtfChart, controller.chart)

/**
 * @api {GET} /v1/etfs/total ETF total chart
 * @apiDescription ETF total chart
 * @apiVersion 1.0.0
 * @apiGroup Etf
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [
 *    {
 *      "date": "2024-05-20",
 *      "total_assets": "58798443187.56",
 *      "total_inflow": "12867073604.77",
 *      "daily_inflow": "241123818.19"
 *    },
 *    {
 *      "date": "2024-05-17",
 *      "total_assets": "56262968939.74",
 *      "total_inflow": "12625949724.33",
 *      "daily_inflow": "221535914.22"
 *    }
 *  ]
 */

router.get('/total', controller.total)
router.get('/treasuries', validateEtfTreasuries, controller.treasuries)

module.exports = router
