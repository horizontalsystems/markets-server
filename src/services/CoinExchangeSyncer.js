const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const CoinTicker = require('../db/models/CoinTicker')

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
      coinsMap[coin.coingecko_id] = { id: coin.id, name: coin.name, code: coin.code }
    }

    console.log(`Coins to sync exchanges ${syncCoins.length}`)

    for (let i = 0; i < syncCoins.length; i += 1) {
      const coin = syncCoins[i]
      console.log(`Syncing coin ${coin.coingecko_id} (${i + 1})`)
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

      const pair = {
        base: ticker.base.toUpperCase(),
        base_uid: ticker.coin_id,
        target: ticker.target.toUpperCase(),
        target_uid: ticker.target_coin_id,
        price: ticker.last,
        volume: ticker.volume,
        volume_usd: ticker.converted_volume.usd,
        market_uid: ticker.market.identifier,
        market_logo: ticker.market.logo,
        market_name: ticker.market.name,
        trade_url: ticker.trade_url
      }

      if (pair.price <= 0 || pair.volume <= 0) {
        continue
      }

      const baseCoin = coinsMap[ticker.coin_id]
      if (baseCoin) {
        pair.base_coin_id = baseCoin.id
        const code = baseCoin.code.toUpperCase()

        if (code !== pair.base) {
          pair.base = code
        }
      } else {
        continue
      }

      const targetCoin = coinsMap[ticker.target_coin_id]
      if (targetCoin) {
        pair.target_coin_id = targetCoin.id
        const code = targetCoin.code.toUpperCase()
        if (code !== pair.target) {
          pair.target = code
        }
      }

      markets.push(pair)
    }

    if (!markets.length) {
      return
    }

    await CoinTicker.deleteAll(coin.id)
    await CoinTicker.bulkCreate(markets)
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
