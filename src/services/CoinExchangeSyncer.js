const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const CoinMarket = require('../db/models/CoinMarket')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')

class CoinExchangeSyncer extends CoinPriceHistorySyncer {

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
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    console.log(`Coins to sync exchanges ${coins.length}`)

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      console.log(`Syncing coin ${coin.coingecko_id} (${i + 1})`)
      await this.syncCoinInfo(coin)
    }
  }

  async syncCoinInfo(coin) {
    try {
      const data = await this.fetchExchanges(coin.coingecko_id)
      await this.updateCoinInfo(data, coin.id, coin.coingecko_id)
    } catch (e) {
      await this.handleHttpError(e)
    }
  }

  async fetchExchanges(uid, page = 1) {
    const data = await coingecko.getTickers(uid, page)
    console.log(`Fetched ${data.length} tickers for ${uid}`)
    await utils.sleep(20000)

    if (data.length < 100 || page > 5) {
      return data
    }

    return data.concat(await this.fetchExchanges(uid, page + 1))
  }

  async updateCoinInfo(tickers, coinId, uid) {
    const markets = tickers.map(ticker => {
      return {
        base: ticker.base,
        target: ticker.target,
        price: ticker.last,
        volume: ticker.volume,
        volume_usd: ticker.converted_volume.usd,
        market_uid: ticker.market.identifier,
        market_logo: ticker.market.logo,
        market_name: ticker.market.name,
        coin_id: coinId,
      }
    })

    if (!markets.length) {
      return
    }

    await CoinMarket.deleteAll(coinId)
    await CoinMarket.bulkCreate(markets)
      .then(records => {
        console.log(`Inserted tickers ${records.length} for coin ${uid}`)
      })
      .catch(err => {
        console.log(err)
      })
  }

}

module.exports = CoinExchangeSyncer
