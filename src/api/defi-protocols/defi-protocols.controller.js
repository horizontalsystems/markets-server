const DefiProtocolTvl = require('../../db/models/DefiProtocolTvl')
const DefiProtocol = require('../../db/models/DefiProtocol')
const serializer = require('./defi-protocols.serializer')
const { handleError } = require('../middlewares')

exports.index = async (req, res) => {
  const protocols = await DefiProtocol.getList()
  res.send(serializer.serializeIndex(protocols, req.currencyRate))
}

exports.list = async (req, res) => {
  const protocols = await DefiProtocol.getList()
  res.send(serializer.serializeList(protocols, req.currencyRate))
}

exports.dapps = async (req, res) => {
  try {
    const protocols = await DefiProtocol.findAll({
      attributes: ['name', 'url', 'tvl_change'],
      raw: true,
      where: {
        url: DefiProtocol.literal('nullif(trim(url),\'\') is not null'),
        tvl: DefiProtocol.literal('tvl > 1000000')
      }
    })

    res.send(serializer.serializeDapps(protocols))
  } catch (e) {
    handleError(res, 500, 'Internal Server Error')
  }
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
