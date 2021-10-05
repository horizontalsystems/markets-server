const express = require('express')
const coins = require('./coin.controller')
const validator = require('./coin.validator')

const router = express.Router()

router.get('/', coins.index)
router.get('/markets', validator.validateMarkets, coins.markets)
router.get('/markets_prices', validator.validateMarketsPrices, coins.marketsPrices)
router.get('/top_markets', validator.validateTopMarkets, coins.topMarkets)
router.get('/:id', coins.show)
router.get('/:id/transactions', coins.transactions)

module.exports = router
