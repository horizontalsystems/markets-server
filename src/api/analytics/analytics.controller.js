const serializer = require('./analytics.serializer')
const Coin = require('../../db/models/Coin')
const CoinStats = require('../../db/models/CoinStats')
const DexVolume = require('../../db/models/DexVolume')
const DexLiquidity = require('../../db/models/DexLiquidity')
const Address = require('../../db/models/Address')
const Transaction = require('../../db/models/Transaction')
const DefiProtocol = require('../../db/models/DefiProtocol')
const DefiProtocolTvl = require('../../db/models/DefiProtocolTvl')
const CoinPrice = require('../../db/models/CoinPrice')

exports.show = async ({ params, dateFrom, dateTo, dateInterval }, res) => {
  try {
    const coin = await Coin.getPlatforms(params.uid)
    if (!coin) {
      return res.status(404).send({ error: 'Coin not found' })
    }

    const stats = await CoinStats.analytics(coin.id)

    const cexVolumes = await CoinPrice.getListByCoin(coin.id, dateInterval, dateFrom)
    const dexVolumes = await DexVolume.getByPlatform(coin.platforms, dateInterval, dateFrom, dateTo)
    const dexLiquidity = await DexLiquidity.getByPlatform(coin.platforms, dateInterval, dateFrom, dateTo)
    const addresses = await Address.getByPlatform(coin.platforms, dateInterval, dateFrom, dateTo)
    const transactions = await Transaction.getByPlatform(coin.platforms, dateInterval, dateFrom, dateTo)

    const defiProtocolData = {}
    const defiProtocol = await DefiProtocol.findOne({ where: { coin_id: coin.id } })
    if (defiProtocol) {
      defiProtocolData.tvls = await DefiProtocolTvl.getByDefiProtocol(defiProtocol.id, dateFrom, dateInterval)
      defiProtocolData.ratio = parseFloat(coin.market_cap) / parseFloat(defiProtocol.tvl)
    }

    if (stats) {
      res.send(
        serializer.overview({
          cexVolumes,
          dexVolumes,
          dexLiquidity,
          addresses,
          transactions,
          defiProtocolData,
          ranks: stats.rank || {},
          other: stats.other || {}
        })
      )
    } else {
      res.status(404)
    }
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}
