const Coin = require('../../db/models/Coin')
const CoinTvl = require('../../db/models/CoinTvl')
const serializer = require('./defi-coins.serializer')
const { utcDate } = require('../../utils')

exports.index = async (req, res) => {
  const coins = await Coin.getDefiCoins()
  res.send(serializer.serializeList(coins, req.currencyRate))
}

exports.tvls = async ({ params, query, currencyRate }, res) => {

  let window
  let dateFrom

  switch (query.interval) {
    case '1d':
      window = '1h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '7d':
      window = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    default:
      window = '1d'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -30 })
      break
  }

  const tvls = await CoinTvl.getListByCoinUid(params.uid, dateFrom, window)

  if (tvls) {
    res.send(serializer.serializeTvls(tvls, currencyRate))
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}
