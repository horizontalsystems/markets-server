const express = require('express')
const controller = require('./stocks.controller')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

router.get('/', setCurrencyRate, controller.index)

module.exports = router
