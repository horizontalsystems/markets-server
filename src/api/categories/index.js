const express = require('express')
const controller = require('./categories.controller')
const { setCurrencyRate } = require('../middlewares')

const router = express.Router()

router.get('/', controller.index)
router.get('/:uid/coins', setCurrencyRate, controller.coins)

module.exports = router
