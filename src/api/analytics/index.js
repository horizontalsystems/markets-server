const express = require('express')
const controller = require('./analytics.controller')
const { setMonthlyInterval } = require('../middlewares')

const router = express.Router()

router.get('/:uid', setMonthlyInterval, controller.show)

module.exports = router
