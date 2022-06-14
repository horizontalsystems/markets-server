const express = require('express')
const controller = require('./chain.controller')

const router = express.Router()

router.get('/:chain', controller.blockNumber)
router.get('/:chain/hashes', controller.blockHashes)

module.exports = router
