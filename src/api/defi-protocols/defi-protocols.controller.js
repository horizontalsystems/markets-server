const DefiProtocolTvl = require('../../db/models/DefiProtocolTvl')
const DefiProtocol = require('../../db/models/DefiProtocol')
const serializer = require('./defi-protocols.serializer')

exports.index = async (req, res) => {
  const coins = await DefiProtocol.getList()
  res.send(serializer.serializeList(coins, req.currencyRate))
}

exports.tvls = async ({ params, dateInterval, dateFrom, currencyRate }, res) => {
  const tvls = await DefiProtocolTvl.getListByCoinUid(params.uid, dateFrom, dateInterval)

  if (tvls) {
    res.send(serializer.serializeTvls(tvls, currencyRate))
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}
