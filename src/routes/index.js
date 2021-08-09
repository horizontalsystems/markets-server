const express = require('express')
const coin = require('../api/coin')
const language = require('../api/language')
const category = require('../api/category')
const error = require('./middlewares/error')

const router = express.Router()

router.use('/docs', express.static('docs'))

router.use('/coins', coin)
router.use('/languages', language)
router.use('/categories', category)

// if error is not an instanceOf APIError, convert it.
router.use(error.converter)

// catch 404 and forward to error handler
router.use(error.notFound)

// error handler, send stacktrace only during development
router.use(error.handler)

module.exports = router
