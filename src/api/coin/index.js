const express = require('express')
const coins = require('./coin.controller')

const router = express.Router()

router.get('/', coins.index)
router.get('/markets', coins.markets)
router.get('/top_markets', coins.topMarkets)
router.get('/prices', coins.prices)
router.get('/:id', coins.show)
router.get('/:id/transactions', coins.transactions)

module.exports = router
