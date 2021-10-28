const defillama = require('../providers/defillama')
const logger = require('../config/logger')
const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const CoinTvl = require('../db/models/CoinTvl')

class DefiCoinSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await CoinTvl.exists()) {
      return
    }

    const coins = await Coin.getDefiCoins()

    if (!coins.length) {
      return this.syncProtocols(await this.fetchProtocols())
    }

    for (let i = 0; i < coins.length; i += 1) {
      await this.syncProtocol(coins[i])
    }
  }

  async syncProtocol(coin) {
    try {
      logger.info(`Syncing ${coin.defillama_id}`)

      const data = await defillama.getProtocol(coin.defillama_id)
      const tvls = []

      for (let i = 0; i < data.tvl.length; i += 1) {
        const tvl = data.tvl[i]
        const date = new Date(tvl.date * 1000)
        date.setMinutes(0, 0, 0)

        tvls.push({
          coin_id: coin.id,
          date: date.getTime(),
          tvl: tvl.totalLiquidityUSD
        })
      }

      await CoinTvl.bulkCreate(tvls, {
        updateOnDuplicate: ['date', 'coin_id']
      })
    } catch (e) {
      console.error(e)
    }
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats({ dateTo }) {
    try {
      const protocols = await this.fetchProtocols()
      await this.syncProtocols(protocols)
      await this.syncTvls(protocols, dateTo)
    } catch (e) {
      console.error(e)
    }
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await CoinTvl.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await CoinTvl.deleteExpired(dateFrom, dateTo)
  }

  async syncTvls(protocols, dateTo) {
    const ids = {}
    const tvls = []
    const coins = await Coin.getDefiCoins()

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      ids[coin.uid] = coin.id
    }

    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      const coinId = ids[protocol.gecko_id]

      if (!protocol || !protocol.gecko_id || !coinId) {
        continue
      }

      logger.info(`Syncing tvl for ${protocol.gecko_id}`)

      tvls.push({
        coin_id: coinId,
        date: dateTo,
        tvl: protocol.tvl
      })
    }

    await CoinTvl.bulkCreate(tvls, {
      // updateOnDuplicate: ['date', 'coin_id'],
      ignoreDuplicates: true
    })
  }

  async syncProtocols(protocols) {
    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      if (!protocol || !protocol.gecko_id) {
        continue
      }

      await Coin.update({
        defillama_id: protocol.slug,
        defi_data: {
          tvl: protocol.tvl,
          tvl_rank: i + 1,
          tvl_change_1h: protocol.change_1h,
          tvl_change_1d: protocol.change_1d,
          tvl_change_7d: protocol.change_7d,
          staking: protocol.staking,
          chains: protocol.chains
        }
      }, {
        where: { uid: protocol.gecko_id }
      })

      logger.info(`Updated protocol ${protocol.gecko_id} = ${protocol.slug}`)
    }
  }

  async fetchProtocols() {
    let protocols = []
    try {
      protocols = await defillama.getProtocols()
      logger.info(`Fetched new protocols ${protocols.length}`)
    } catch (e) {
      logger.error(`Error syncing protocols ${e.message}`)
    }

    return protocols
  }
}

module.exports = DefiCoinSyncer
