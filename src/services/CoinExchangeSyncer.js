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
    const coinsMap = {}
    const coinsList = await this.getCoins()
    const syncCoins = await this.getCoins(uid)

    for (let i = 0; i < coinsList.length; i += 1) {
      const coin = coinsList[i];
      coinsMap[coin.coingecko_id] = { name: coin.name, code: coin.code }
    }

    console.log(`Coins to sync exchanges ${syncCoins.length}`)

    for (let i = 0; i < syncCoins.length; i += 1) {
      const coin = syncCoins[i]
      console.log(`Syncing coin ${coin.uid} (${i + 1})`)
      await this.syncCoinTickers(coin, coinsMap)
    }
  }

  async syncCoinTickers(coin, coinsMap) {
    if (!coin.coingecko_id) return

    try {
      const data = await this.fetchTickers(coin.coingecko_id)
      await this.upsertTickers(data, coin, coinsMap)
    } catch (e) {
      await this.handleHttpError(e)
    }
  }

  async fetchTickers(uid, page = 1) {
    const data = await coingecko.getTickers(uid, page)
    console.log(`Fetched ${data.length} tickers for ${uid}`)
    await utils.sleep(20000)

    if (data.length < 100 || page > 5) {
      return data
    }

    return data.concat(await this.fetchTickers(uid, page + 1))
  }

  async upsertTickers(data, coin, coinsMap) {
    const markets = []

    for (let i = 0; i < data.length; i += 1) {
      const ticker = data[i]
      const base = coin.code.toUpperCase()

      let target = ticker.target.toUpperCase()
      let { volume, last: price } = ticker

      if (price <= 0 || volume <= 0) {
        continue
      }

      if (ticker.coin_id !== coin.coingecko_id) {
        const targetCoin = coinsMap[ticker.coin_id]
        if (!targetCoin) continue

        target = targetCoin.name.toUpperCase()

        volume *= price
        price = 1 / price
      } else if (ticker.target_coin_id !== coin.coingecko_id) {
        const targetCoin = coinsMap[ticker.target_coin_id]
        if (!targetCoin) continue
        target = targetCoin.code.toUpperCase()
      }

      markets.push({
        base,
        target,
        price,
        volume,
        volume_usd: ticker.converted_volume.usd,
        market_uid: ticker.market.identifier,
        market_logo: ticker.market.logo,
        market_name: ticker.market.name,
        trade_url: ticker.trade_url,
        coin_id: coin.id,
      })
    }

    if (!markets.length) {
      return
    }

    await CoinMarket.deleteAll(coin.id)
    await CoinMarket.bulkCreate(markets)
      .then(records => {
        console.log(`Inserted tickers ${records.length} for coin ${coin.coingecko_id}`)
      })
      .catch(err => {
        console.log(err)
      })
  }

  getCoins(uid) {
    return Coin.findAll({
      attributes: ['id', 'coingecko_id', 'name', 'code'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      },
      raw: true
    })
  }
}

module.exports = CoinExchangeSyncer
