const express = require('express')
const controller = require('./infura.controller')

const router = express.Router()

router.post('/', controller.proxy)

module.exports = router
