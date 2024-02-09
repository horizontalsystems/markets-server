const { DateTime } = require('luxon')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const CoinPrice = require('../db/models/CoinPrice')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinPriceSyncer extends CoinPriceHistorySyncer {

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
    const coins = await this.getCoins(uid, true)
    const chunks = this.chunk(Array.from(coins.uids))

    for (let i = 0; i < chunks.length; i += 1) {
      await this.syncSimplePrices(chunks[i], coins.map, coins.mapVolumes)
    }
  }

  async syncSimplePrices(uids, idsMap, mapVolumes) {
    debug(`Syncing simple prices ${uids.length}`)

    try {
      const data = await coingecko.getSimplePrices(uids)
      await this.storeSimplePrices(Object.entries(data), idsMap, mapVolumes)
      await utils.sleep(12000)
    } catch (e) {
      await this.handleHttpError(e)
    }
  }

  async storeSimplePrices(coins, idsMap, mapVolumes) {
    const dt = DateTime.now()
    const dtStr = dt.toSQL()
    const values = []

    const mapPrice = (id, coin) => ({
      coin_id: id,
      price: coin.usd,
      volume: coin.usd_24h_vol,
      volume_normalized: mapVolumes[id]
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

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: [
        'id',
        'coingecko_id',
        [Coin.literal('(SELECT SUM(volume_usd) FROM coin_markets WHERE coin_id = "Coin".id AND market_uid IN (SELECT uid FROM exchanges))'), 'total_volume']
      ],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      },
      raw: true
    })

    const uids = new Set()
    const map = {}
    const mapVolumes = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const cid = coin.coingecko_id
      const ids = map[cid] || (map[cid] = [])

      ids.push(coin.id)
      uids.add(encodeURIComponent(cid))
      mapVolumes[coin.id] = coin.total_volume
    }

    return { uids, map, mapVolumes }
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

module.exports = CoinPriceSyncer
