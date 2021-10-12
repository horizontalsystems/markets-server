const express = require('express')
const controller = require('./categories.controller')
const currencyValidator = require('../currencies/currencies.validator')

const router = express.Router()

router.get('/', controller.index)
router.get('/:uid/markets', [
  currencyValidator.validate,
  controller.markets
])

module.exports = router
