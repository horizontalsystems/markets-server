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
const Subscription = require('../../db/models/Subscription')
const ContractIssue = require('../../db/models/ContractIssue')

exports.subscriptions = async ({ query }, res) => {
  try {
    const address = query.address.split(',')
    const subscrs = await Subscription.getActive(address)

    const subscriptions = subscrs.map(item => ({
      address: item.address,
      deadline: parseInt(item.expire_date.getTime() / 1000, 10)
    }))

    res.send(subscriptions)
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}

exports.preview = async ({ params, query }, res) => {
  try {
    const coin = await Coin.getPlatforms(params.uid)
    if (!coin) {
      return res.status(404).send({ error: 'Coin not found' })
    }

    const subscriptions = []
    if (query.address) {
      const address = query.address.split(',')
      const subscrs = await Subscription.getActive(address)
      if (subscrs.length) {
        const data = subscrs.map(item => ({
          address: item.address,
          deadline: parseInt(item.expire_date.getTime() / 1000, 10)
        }))
        subscriptions.push(...data)
      }
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

    res.send(serializer.preview(preview, subscriptions))
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}

exports.show = async ({ params, dateFrom, dateFromTimestamp, dateTo, dateInterval, currencyRate }, res) => {
  try {
    const coin = await Coin.getPlatforms(params.uid)
    if (!coin) {
      return res.status(404).send({ error: 'Coin not found' })
    }

    const stats = await CoinStats.analytics(coin.id)

    const cexVolumes = await CoinPrice.getListByCoin(coin.id, dateInterval, dateFrom, dateFromTimestamp)
    const dexVolumes = await DexVolume.getByPlatform(coin.platforms, dateInterval, dateFrom, dateFromTimestamp, dateTo)
    const dexLiquidity = await DexLiquidity.getByPlatform(coin.platforms, dateInterval, dateFrom, dateFromTimestamp, dateTo)
    const addresses = await Address.getByPlatform(coin.platforms, dateInterval, dateFrom, dateFromTimestamp, dateTo)
    const transactions = await Transaction.getByPlatform(coin.platforms, dateInterval, dateFrom, dateFromTimestamp, dateTo)
    const holders = await CoinHolderStats.getTotalByPlatforms(coin.platforms)

    const defiProtocolData = {}
    const defiProtocol = await DefiProtocol.findOne({ where: { coin_id: coin.id } })
    if (defiProtocol) {
      defiProtocolData.tvls = await DefiProtocolTvl.getByDefiProtocol(defiProtocol.id, dateFrom, dateFromTimestamp, dateInterval)
      defiProtocolData.ratio = parseFloat(coin.market_cap) / parseFloat(defiProtocol.tvl)
    }

    if (stats) {
      res.send(
        serializer.show({
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
    const holders = await CoinHolderStats.getList(params.uid, query.blockchain_uid)
    if (!holders) {
      res.status(404).send({})
      return
    }
    res.send(serializer.holders(holders, query.blockchain_uid, params.uid, holders.type === 'native'))
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}

exports.issues = async ({ params }, res) => {
  try {
    const issues = await ContractIssue.getIssues(params.uid)
    if (!issues) {
      res.status(404).send({})
      return
    }

    res.send(serializer.issues(issues))
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

exports.addresses = async (req, res, next) => {
  try {
    const data = await Address.getByPlatform(req.coin.platforms, req.dateInterval, req.dateFrom, req.dateFromTimestamp, req.dateTo)
    res.send(serializer.serialize(data, 'count'))
  } catch (e) {
    next(e)
  }
}

exports.transactions = async (req, res, next) => {
  try {
    const data = await Transaction.getByPlatform(req.coin.platforms, req.dateInterval, req.dateFrom, req.dateFromTimestamp, req.dateTo, true)
    res.send(serializer.serialize(data, 'count', req.currencyRate, true))
  } catch (e) {
    next(e)
  }
}

exports.dexVolumes = async (req, res, next) => {
  try {
    const data = await DexVolume.getByPlatform(req.coin.platforms, req.dateInterval, req.dateFrom, req.dateFromTimestamp, req.dateTo)
    res.send(serializer.serialize(data, 'volume', req.currencyRate))
  } catch (e) {
    next(e)
  }
}

exports.dexLiquidity = async (req, res, next) => {
  try {
    const data = await DexLiquidity.getByPlatform(req.coin.platforms, req.dateInterval, req.dateFrom, req.dateFromTimestamp, req.dateTo)
    res.send(serializer.serialize(data, 'volume', req.currencyRate))
  } catch (e) {
    next(e)
  }
}
