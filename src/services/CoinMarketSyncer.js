const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const CoinMarket = require('../db/models/CoinMarket')

class CoinMarketSyncer extends Syncer {

  async start() {
    const running = true
    while (running) {
      try {
        await this.sync()
      } catch (e) {
        console.log(e)
        process.exit(1)
      }
    }
  }

  async sync(uid) {
    const where = { ...(uid && { uid }) }
    const coins = await Coin.findAll({ attributes: ['id', 'coingecko_id'], where })

    console.log(`Coins to sync exchanges ${coins.length}`)

    for (let i = 0; i < coins.length; i += 1) {
      await this.syncCoinInfo(coins[i])
    }
  }

  async syncCoinInfo(coin) {
    console.log(`Syncing coin ${coin.coingecko_id}`)

    try {
      const data = await coingecko.getCoinInfo(coin.coingecko_id, { tickers: true })
      await this.updateCoinInfo(data.tickers, coin.id)
      await utils.sleep(1200)
    } catch ({ message, response = {} }) {
      if (message) {
        console.log(message)
      }

      if (response.status === 429) {
        console.log(`Sleeping 1min; Status ${response.status}`)
        await utils.sleep(60000)
      }

      if (response.status >= 502 && response.status <= 504) {
        console.log(`Sleeping 30s; Status ${response.status}`)
        await utils.sleep(30000)
      }

      if (response.status === 404) {
        await Coin.update(
          { coingecko_id: null },
          { where: { id: coin.id } }
        )
      }
    }
  }

  async updateCoinInfo(tickers, coinId) {
    const markets = tickers.map(ticker => {
      return {
        base: ticker.base,
        target: ticker.target,
        price: ticker.last,
        volume: ticker.volume,
        volume_usd: ticker.converted_volume.usd,
        market_uid: ticker.market.identifier,
        market_name: ticker.market.name,
        coin_id: coinId,
      }
    })

    await CoinMarket.deleteAll(coinId)
    await CoinMarket.bulkCreate(markets)
      .then(records => {
        console.log(`Inserted tickers ${records.length}`)
      })
      .catch(err => {
        console.log(err)
      })
  }

}

module.exports = CoinMarketSyncer
