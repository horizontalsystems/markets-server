const express = require('express')
const controller = require('./coin.controller')

const router = express.Router()

router.get('/', controller.index)
router.get('/prices', controller.prices)
router.get('/:id', controller.show)
module.exports = router
