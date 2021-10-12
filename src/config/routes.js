const express = require('express')

const router = express.Router()

router.use('/docs', express.static('docs'))

router.use('/coins', require('../api/coin'))
router.use('/token_info', require('../api/token'))
router.use('/languages', require('../api/language'))
router.use('/categories', require('../api/categories'))
router.use('/currencies', require('../api/currencies'))

module.exports = router
