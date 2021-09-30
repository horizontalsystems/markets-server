const express = require('express')
const coins = require('./coin.controller')

const router = express.Router()

router.get('/', coins.list)
router.get('/all', coins.all)
router.get('/prices', coins.prices)
router.get('/:id', coins.show)
router.get('/:id/transactions', coins.transactions)

module.exports = router
