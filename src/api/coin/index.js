const express = require('express')
const controller = require('./coin.controller')

const router = express.Router()

router.get('/', controller.coins)
router.get('/all', controller.all)
router.get('/prices', controller.prices)
router.get('/:id', controller.show)

module.exports = router
