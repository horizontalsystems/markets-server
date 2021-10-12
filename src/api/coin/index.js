const express = require('express')
const coins = require('./coin.controller')
const validator = require('./coin.validator')

const router = express.Router()

router.get('/', coins.index)
router.get('/markets', validator.validateMarkets, validator.validateCurrency, coins.markets)
router.get('/markets_prices', validator.validateMarketsPrices, validator.validateCurrency, coins.marketsPrices)
router.get('/top_markets', validator.validateTopMarkets, validator.validateCurrency, coins.topMarkets)
router.get('/:id', coins.show)
router.get('/:id/transactions', coins.transactions)
router.get('/:id/addresses', coins.addresses)
router.get('/:id/addresses_holders', coins.addressHolders)
router.get('/:id/addresses_ranks', coins.addressRanks)

module.exports = router
