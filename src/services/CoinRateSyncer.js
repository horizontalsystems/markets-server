const { DateTime } = require('luxon')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const CoinPrice = require('../db/models/CoinPrice')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinRateSyncer extends CoinPriceHistorySyncer {

  constructor() {
    super()
    this.priceHistory = {}
  }

  async start() {
    this.cron('10m', this.storePriceHistory)

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
    const chunks = this.chunk(Array.from(coins.uids))

    for (let i = 0; i < chunks.length; i += 1) {
      await this.syncSimplePrices(chunks[i], coins.map)
    }
  }

  async syncSimplePrices(uids, idsMap) {
    debug(`Syncing simple prices ${uids.length}`)

    try {
      const data = await coingecko.getSimplePrices(uids)
      await this.storeSimplePrices(Object.entries(data), idsMap)
      await utils.sleep(8000)
    } catch (e) {
      await this.handleHttpError(e)
    }
  }

  async storeSimplePrices(coins, idsMap) {
    const dt = DateTime.now()
    const dtStr = dt.toSQL()
    const values = []

    const mapPrice = (id, coin) => ({
      coin_id: id,
      price: coin.usd,
      volume: coin.usd_24h_vol
    })

    for (let i = 0; i < coins.length; i += 1) {
      const [uid, coin] = coins[i];
      const coinIds = idsMap[uid]

      if (coinIds && coin.usd) {
        coinIds.forEach(id => {
          values.push([id, coin.usd, coin.usd_24h_change, dtStr])
          this.priceHistory[id] = mapPrice(id, coin)
        })
      }
    }

    await this.upsert(values)
  }

  storePriceHistory() {
    const now = utils.utcDate()
    const records = Object.values(this.priceHistory).map(item => {
      return { ...item, date: now }
    })

    if (!records.length) {
      return
    }
    this.priceHistory = {}
    console.log('Syncing historical prices', records.length)
    return CoinPrice.bulkCreate(records, { updateOnDuplicate: ['price'] })
  }

  async upsert(values) {
    if (!values.length) {
      return
    }

    try {
      const query = `
        UPDATE coins AS c set
          price = v.price,
          price_change_24h = v.price_change,
          last_updated = v.last_updated::timestamptz
        FROM (values :values) as v(id, price, price_change, last_updated)
        WHERE c.id = v.id`

      await Coin.queryUpdate(query, { values })
      debug(`Synced coins ${values.length}`)
    } catch (e) {
      debug(e)
    }
  }

  chunk(array) {
    const chunkList = []
    const chunkSize = 6000 // to fit header buffers

    let size = 0
    let index = 0

    for (let i = 0; i < array.length; i += 1) {
      const item = array[i]

      if (size > chunkSize) {
        size = 0
        index += 1
      }

      if (!chunkList[index]) {
        chunkList[index] = []
      }

      chunkList[index].push(item)
      size += item.length
    }

    return chunkList
  }
}

module.exports = CoinRateSyncer
