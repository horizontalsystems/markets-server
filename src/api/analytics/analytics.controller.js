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
const CoinHolderStats = require('../../db/models/CoinHolderStats')

exports.preview = async ({ params }, res) => {
  try {
    const coin = await Coin.getPlatforms(params.uid)
    if (!coin) {
      return res.status(404).send({ error: 'Coin not found' })
    }

    const stats = await CoinStats.analytics(coin.id)
    const defiProtocol = await DefiProtocol.findOne({ where: { coin_id: coin.id } })
    const [data] = await Coin.query(`
      SELECT
        exists(select 1 from dex_volumes where platform_id in (:platforms)) as dexVolumes,
        exists(select 1 from dex_liquidities where platform_id in (:platforms)) as dexLiquidity,
        exists(select 1 from addresses where platform_id in (:platforms)) as addresses,
        exists(select 1 from coin_holder_stats where platform_id in (:platforms)) as holders,
        exists(select 1 from transactions where platform_id in (:platforms)) as transactions,
        exists(select 1 from coin_prices where coin_id in (:coin)) as cexVolumes
    `, { platforms: coin.platforms, coin: coin.id })

    const preview = { ...data, ranks: {}, other: {}, defiProtocol }
    if (stats) {
      preview.ranks = stats.rank || {}
      preview.other = stats.other || {}
    }

    res.send(serializer.preview(preview))
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}

exports.show = async ({ params, dateFrom, dateTo, dateInterval, currencyRate }, res) => {
  if (params.uid === 'pancakeswap-token') {
    return res.status(401).send({}) // todo: for testing only
  }

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
    const holders = await CoinHolderStats.getTotalByPlatforms(coin.platforms)

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
          holders,
          ranks: stats.rank || {},
          other: stats.other || {}
        }, currencyRate)
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

exports.holders = async ({ params, query }, res) => {
  try {
    const [holders] = await CoinHolderStats.getList(params.uid, query.blockchain_uid)
    res.send(serializer.holders(holders))
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}

exports.ranks = async ({ query }, res) => {
  try {
    const data = await CoinStats.getList()
    res.send(serializer.ranks(data, query.type))
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}
