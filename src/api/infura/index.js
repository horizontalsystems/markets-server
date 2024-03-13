const express = require('express')
const controller = require('./infura.controller')

const router = express.Router()

router.post('/mainnet', controller.mainnetProxy)
router.post('/sepolia', controller.sepoliaProxy)

module.exports = router
