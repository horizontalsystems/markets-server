const express = require('express')
const controller = require('./vaults.controller')
const { validateVault } = require('./vaults.validator')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

router.get('/', setCurrencyRate, controller.index)
router.get('/:address', validateVault, setCurrencyRate, controller.show)

module.exports = router
