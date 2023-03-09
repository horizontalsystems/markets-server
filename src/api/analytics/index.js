const express = require('express')
const controller = require('./analytics.controller')
const { setMonthlyInterval, setCurrencyRate } = require('../middlewares')
const { validateRanks, validateShow, validatePreview, validateHolders } = require('./analytics.validator')

const router = express.Router()

router.get('/ranks', validateRanks, controller.ranks)
router.get('/:uid', validateShow, setCurrencyRate, setMonthlyInterval, controller.show)

router.get('/:uid/preview', validatePreview, controller.preview)
router.get('/:uid/holders', validateHolders, controller.holders)

module.exports = router
