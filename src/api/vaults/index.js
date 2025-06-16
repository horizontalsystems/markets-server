const express = require('express')
const controller = require('./vaults.controller')
const { validateVault } = require('./vaults.validator')

const router = express.Router()

router.get('/', controller.index)
router.get('/:address', validateVault, controller.show)

module.exports = router
