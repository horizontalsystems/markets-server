const { parseInt } = require('lodash')
const { DateTime } = require('luxon')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const defillama = require('../providers/defillama')
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
    this.cron('5m', this.syncDefiCoins)

    await this.sync()
  }

  async sync(fromDefillama) {
    const running = true
    while (running) {
      try {
        await (fromDefillama ? this.syncFromDefillama() : this.syncFromCoingecko())
      } catch (e) {
        debug(e)
        process.exit(1)
      }
    }
  }

  async syncFromCoingecko(uid) {
    const coins = await this.getCoins(uid)
    const chunks = this.chunk(Array.from(coins.uids))

    for (let i = 0; i < chunks.length; i += 1) {
      await this.fetchFromCoingecko(chunks[i], coins.map)
    }
  }

  async syncFromDefillama(uid) {
    const coins = await this.getCoins(uid)
    const chunks = this.chunk(Array.from(coins.uids).map(i => `coingecko:${i}`))

    for (let i = 0; i < chunks.length; i += 1) {
      await this.fetchFromDefillama(chunks[i], coins.map)
    }
  }

  async fetchFromCoingecko(coinUids, idsMap) {
    debug(`Syncing coins ${coinUids.length}`)

    try {
      const coins = await coingecko.getMarkets(coinUids)
      await this.updateCoins(coins, idsMap)
      await utils.sleep(3000)
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

  async fetchFromDefillama(coinUids, idsMap) {
    debug(`Syncing coins ${coinUids.length}`)

    const data = await defillama.getPrices(coinUids)
    const prices = {}

    Object.entries(data).forEach(([key, value]) => {
      const [, address] = key.split(':')
      const coinIds = idsMap[address] || []
      const now = DateTime.now()

      coinIds.forEach(coinId => {
        let timestamp = new Date(value.timestamp * 1000)
        if (timestamp >= now.plus({ minutes: -30 })) {
          timestamp = new Date()
        }

        prices[coinId] = { timestamp, price: value.price }
      })
    })

    await this.updateCoinPrices(Object.entries(prices))
    await utils.sleep(500)
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

  async syncDefiCoins() {
    const coins = await Coin.query(`
      SELECT c.id, p.chain_uid, p.address
        FROM coins c, platforms p
      WHERE c.id = p.coin_id
        AND c.is_defi = true
        AND c.coingecko_id is null
        AND p.address <> ''
    `)

    const prices = {}
    const map = {}
    const ids = coins.map(coin => {
      map[coin.address] = coin.id
      return `${this.mapDefillamaChain(coin.chain_uid)}:${coin.address}`
    })

    console.log('Fetching staked coins prices', ids.length)
    const response = await defillama.getPrices(ids)

    Object.entries(response).forEach(([key, value]) => {
      const [, address] = key.split(':')
      const coinId = map[address]

      if (coinId) {
        prices[coinId] = { price: value.price, timestamp: new Date(value.timestamp * 1000) }
      }
    })

    console.log('Fetched staked coins prices', prices)
    await this.updateCoinPrices(Object.entries(prices))
  }

  updateCoinPrices(entries) {
    const records = entries
      .map(([id, value]) => {
        if (!id || !value || !value.price || !value.timestamp) {
          return null
        }

        return [
          parseInt(id),
          value.price,
          value.timestamp
        ]
      })
      .filter(i => i)

    if (!records.length) {
      return
    }

    return Coin.updatePrices(records)
      .catch(e => {
        console.log(e)
      })
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

  mapDefillamaChain(chain) {
    switch (chain) {
      case 'binance-smart-chain':
        return 'bsc'
      case 'arbitrum-one':
        return 'arbitrum'
      default:
        return chain
    }
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
