const { parseInt, chunk } = require('lodash')
const { DateTime } = require('luxon')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const CoinPrice = require('../db/models/CoinPrice')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinPriceSyncer extends CoinPriceHistorySyncer {

  constructor() {
    super()
    this.prices = {}
  }

  async start() {
    this.adjustHistoryGaps()
    this.cron('0 0 */3 * *', this.syncUids)
    this.cron('10m', this.storeCoinPrices)

    await this.schedule()
  }

  async schedule() {
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
      await this.fetchFromCoingecko(chunks[i], coins.map)
    }
  }

  async fetchFromCoingecko(coinUids, idsMap) {
    debug(`Syncing coins ${coinUids.length}`)

    try {
      const coins = await coingecko.getMarkets(coinUids, 1, 250)
      await this.updateCoins(coins, idsMap)
      await utils.sleep(20000)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(message)
      }

      if (response.status === 429) {
        debug(`Sleeping 1min; Status ${response.status}`)
        await utils.sleep(60000)
      } else if (response.status >= 502 && response.status <= 504) {
        debug(`Sleeping 30s; Status ${response.status}`)
        await utils.sleep(30000)
      } else if (response.status >= 400 && response.status <= 403) {
        debug(`Sleeping 30s; Status ${response.status}`)
        await utils.sleep(30000)
      } else {
        await utils.sleep(50000)
      }
    }
  }

  async updateCoins(coins, idsMap) {
    const dt = DateTime.now()
    const minutes = dt.get('minute')
    const minutesRounded = dt
      .set({ minute: 10 * parseInt(minutes / 10) })
      .toFormat('yyyy-MM-dd HH:mm')

    const mapMarket = (id, item) => [
      id,
      item.price,
      JSON.stringify(item.price_change),
      JSON.stringify(item.market_data),
      item.last_updated
    ]

    const mapPrice = (id, coin) => ({
      coin_id: id,
      price: coin.price,
      date: minutesRounded,
      volume: coin.market_data.total_volume
    })

    const values = []

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i];
      const coinIds = idsMap[coin.coingecko_id]

      if (coinIds && coin.price) {
        coinIds.forEach(id => {
          values.push(mapMarket(id, coin))
          this.prices[id] = mapPrice(id, coin)
        })
      }
    }

    if (!values.length) {
      return
    }

    try {
      await Coin.updateCoins(values)
      debug(`Synced coins ${values.length}`)
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

    return Coin.update(
      { coingecko_id: null },
      { where: { id: depCoins.map(c => c.id) } }
    )
  }

  async storeCoinPrices() {
    const records = Object.values(this.prices)
    if (!records.length) {
      return
    }
    console.log('Syncing historical prices', records.length)
    this.prices = {}
    return CoinPrice.bulkCreate(records, { updateOnDuplicate: ['price'] })
  }

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const uids = new Set()
    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const cid = coin.coingecko_id
      const ids = map[cid] || (map[cid] = [])

      uids.add(encodeURIComponent(cid))
      ids.push(coin.id)
    }

    return { uids, map }
  }
}

module.exports = CoinPriceSyncer
