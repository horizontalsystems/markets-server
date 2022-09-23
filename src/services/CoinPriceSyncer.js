const { parseInt } = require('lodash')
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

  async start() {
    this.adjustHistoryGaps()
    this.cron('1d', this.syncUids)

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
    const where = {
      ...(uid && { uid }),
      coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
    }
    const coins = await Coin.findAll({ attributes: ['id', 'coingecko_id'], where })
    const uids = new Set()
    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const ids = map[coin.coingecko_id] || (map[coin.coingecko_id] = [])

      uids.add(coin.coingecko_id)
      ids.push(coin.id)
    }

    const chunks = this.chunk(Array.from(uids))

    for (let i = 0; i < chunks.length; i += 1) {
      await this.syncCoins(chunks[i], map)
    }
  }

  async syncCoins(coinUids, idsMap) {
    debug(`Syncing coins ${coinUids.length}`)

    try {
      const coins = await coingecko.getMarkets(coinUids)
      await this.updateCoins(coins, idsMap)
      await utils.sleep(2000)
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

    const mapData = (id, item) => [
      id,
      item.price,
      JSON.stringify(item.price_change),
      JSON.stringify(item.market_data),
      item.last_updated,
      minutesRounded
    ]

    const values = coins
      .filter(c => c.price && idsMap[c.coingecko_id])
      .flatMap(c => idsMap[c.coingecko_id].map(id => mapData(id, c)))

    if (!values.length) {
      return
    }

    try {
      await Coin.updateCoins(values)
      await CoinPrice.insertMarkets(values)
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

  chunk(array) {
    const chunk = []
    const chunkSize = 6000 // to fit header buffers

    let size = 0
    let index = 0

    for (let i = 0; i < array.length; i += 1) {
      const item = array[i]

      if (size > chunkSize) {
        size = 0
        index += 1
      }

      if (!chunk[index]) {
        chunk[index] = []
      }

      chunk[index].push(item)
      size += item.length
    }

    return chunk
  }

}

module.exports = CoinPriceSyncer
