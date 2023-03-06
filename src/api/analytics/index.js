const express = require('express')
const controller = require('./analytics.controller')
const { setMonthlyInterval } = require('../middlewares')

const router = express.Router()

router.get('/:uid', setMonthlyInterval, controller.show)

router.get('/:uid/preview', controller.preview)
router.get('/:uid/holders', controller.holders)

module.exports = router
