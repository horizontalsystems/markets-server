const express = require('express')

const router = express.Router()

router.use('/docs', express.static('docs'))

router.use('/coins', require('../api/coins'))
router.use('/categories', require('../api/categories'))
router.use('/currencies', require('../api/currencies'))
router.use('/languages', require('../api/languages'))
router.use('/token_info', require('../api/token_info'))

module.exports = router
