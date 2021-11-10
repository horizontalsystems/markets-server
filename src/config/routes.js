const express = require('express')

const router = express.Router()

router.use('/docs', express.static('docs'))

router.use('/coins', require('../api/coins'))
router.use('/defi-coins', require('../api/defi-coins'))
router.use('/addresses', require('../api/addresses'))
router.use('/funds', require('../api/funds'))
router.use('/transactions', require('../api/transactions'))
router.use('/categories', require('../api/categories'))
router.use('/currencies', require('../api/currencies'))
router.use('/languages', require('../api/languages'))
router.use('/token_info', require('../api/token_info'))
router.use('/reports', require('../api/reports'))
router.use('/global-markets', require('../api/global-markets'))

module.exports = router
