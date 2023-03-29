const express = require('express')
const controller = require('./analytics.controller')
const { setCurrencyRate, requireCoin, setDailyInterval } = require('../middlewares')
const { validateRanks, validateShow, validatePreview, validateHolders, validateDexData } = require('./analytics.validator')

const router = express.Router()

router.get('/ranks', validateRanks, controller.ranks)
router.get('/:uid', validateShow, setCurrencyRate, setDailyInterval, controller.show)

router.get('/:uid/preview', validatePreview, controller.preview)
router.get('/:uid/holders', validateHolders, controller.holders)
router.get('/:uid/addresses', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.addresses)
router.get('/:uid/transactions', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.transactions)
router.get('/:uid/dex-volumes', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.dexVolumes)
router.get('/:uid/dex-liquidity', validateDexData, requireCoin, setCurrencyRate, setDailyInterval, controller.dexLiquidity)

module.exports = router
