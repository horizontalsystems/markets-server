const express = require('express')
const controller = require('./coin.controller')

const router = express.Router()

router.get('/', controller.index)
router.get('/:id', controller.show)
router.get('/prices', controller.prices)
module.exports = router
