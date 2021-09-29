const express = require('express')
const controller = require('./token.controller')

const router = express.Router()

router.get('/:type', controller.info)

module.exports = router
