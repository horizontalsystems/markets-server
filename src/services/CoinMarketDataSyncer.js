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
    const coins = await this.getCoinsWithPrice(uid)
    const chunks = chunk(Array.from(coins.uids), 250)

    for (let i = 0; i < chunks.length; i += 1) {
      await this.syncMarketData(chunks[i], coins.map, coins.priceMap)
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

  async getCoinsWithPrice(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const uids = new Set()
    const map = {}
    const priceMap = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const cid = coin.coingecko_id
      const ids = map[cid] || (map[cid] = [])

      uids.add(encodeURIComponent(cid))
      ids.push(coin.id)
    }

    const prices = await CoinPrice.get3MonthPrices(Object.values(map).flat())

    for (let i = 0; i < prices.length; i += 1) {
      const item = prices[i];
      priceMap[item.coin_id] = item.price
    }

    return { uids, map, priceMap }
  }
}

module.exports = CoinMarketDataSyncer
