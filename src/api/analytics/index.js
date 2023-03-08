const express = require('express')
const controller = require('./analytics.controller')
const { validateRanks } = require('./analytics.validator')
const { setMonthlyInterval } = require('../middlewares')

const router = express.Router()

router.get('/ranks', validateRanks, controller.ranks)
router.get('/:uid', setMonthlyInterval, controller.show)

router.get('/:uid/preview', controller.preview)
router.get('/:uid/holders', controller.holders)

module.exports = router
