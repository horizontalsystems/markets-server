const { chunk } = require('lodash')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Platform = require('../db/models/Platform')
const Coin = require('../db/models/Coin')
const CoinPrice = require('../db/models/CoinPrice')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinMarketDataSyncer extends CoinPriceHistorySyncer {

  async start() {
    this.adjustHistoryGaps()
    this.cron('0 0 */3 * *', this.syncUids)

    const running = true
    while (running) {
      try {
        await this.sync()
      } catch (e) {
        debug(e)
        process.exit(1)
      }
    }
  }

  async sync(uid) {
    const coins = await this.getCoins(uid)
    const chunks = chunk(Array.from(coins.uids), 250)

    for (let i = 0; i < chunks.length; i += 1) {
      const chunkUids = chunks[i]
      const chunkIds = chunkUids.map(item => coins.map[item])
      const { map3M } = await this.getPricesMap(chunkIds.flat())
      await this.syncMarketData(chunkUids, coins.map, map3M)
    }
  }

  async syncMarketData(coinUids, idsMap, priceMap) {
    debug(`Syncing coins ${coinUids.length}`)

    try {
      const coins = await coingecko.getMarkets(coinUids, 1, 250)
      await this.updateCoins(coins, idsMap, priceMap)
      await utils.sleep(20000)
    } catch (e) {
      await this.handleHttpError(e)
    }
  }

  async updateCoins(coins, idsMap, priceMap) {
    const values = []
    const mapMarketData = (id, item) => {
      const priceChange = item.price_change
      const price3Month = priceMap[id]

      if (price3Month) {
        priceChange['90d'] = utils.percentageBetweenNumber(price3Month, item.price)
      }

      return [
        id,
        JSON.stringify(priceChange),
        JSON.stringify(item.market_data),
        item.img_path
      ]
    }

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const coinIds = idsMap[coin.coingecko_id]

      if (coinIds && coin.price) {
        coinIds.forEach(id => {
          values.push(mapMarketData(id, coin))
        })
      }
    }

    await this.upsert(values)
  }

  async upsert(values) {
    if (!values.length) return

    try {
      const query = `
        UPDATE coins AS c set
          price_change = v.price_change::json,
          market_data = v.market_data::json,
          img_path = v.img_path::text
        FROM (values :values) as v(id, price_change, market_data, img_path)
        WHERE c.id = v.id`

      await Coin.queryUpdate(query, { values })
      debug(`Synced coins market data ${values.length}`)
    } catch (e) {
      debug(e)
    }
  }

  async syncUids() {
    const allCoins = utils.reduceMap(await coingecko.getCoinList(), 'id')
    const oldCoins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const depCoins = oldCoins.filter(c => !allCoins[c.coingecko_id])
    console.log(`Deprecated or deleted coins ${depCoins.length}`, JSON.stringify(depCoins))

    if (!depCoins.length) {
      return
    }

    const ids = depCoins.map(c => c.id)

    if (depCoins.length > 100) {
      return Coin.update(
        { coingecko_id: null },
        { where: { id: ids } }
      )
    }

    await Coin.destroy({ where: { id: ids } })
    await Platform.destroy({ where: { coin_id: Platform.literal('coin_id IS NULL') } })
  }

  async getPricesMap(ids) {
    const prices1d = [] // await CoinPrice.getLastPricesInRange(ids, '1d')
    const prices3M = await CoinPrice.getLastPricesInRange(ids, '90d')

    const map1d = {}
    const map3M = {}

    for (let i = 0; i < prices1d.length; i += 1) {
      const item = prices1d[i];
      map1d[item.coin_id] = item.price
    }

    for (let i = 0; i < prices3M.length; i += 1) {
      const item = prices3M[i];
      map3M[item.coin_id] = item.price
    }

    return { map1d, map3M }
  }
}

module.exports = CoinMarketDataSyncer
