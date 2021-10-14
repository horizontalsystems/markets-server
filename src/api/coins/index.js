const express = require('express')
const controller = require('./coins.controller')
const { validateCoins } = require('./coins.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

router.get('/', validateCoins, setCurrencyRate, controller.index)
router.get('/:id', setCurrencyRate, controller.show)
router.get('/:id/transactions', controller.transactions)
router.get('/:id/addresses', controller.addresses)
router.get('/:id/addresses_holders', controller.addressHolders)
router.get('/:id/addresses_ranks', controller.addressRanks)

module.exports = router
