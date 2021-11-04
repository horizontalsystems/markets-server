const defillama = require('../providers/defillama')
const logger = require('../config/logger')
const Syncer = require('./Syncer')
const DefiCoin = require('../db/models/DefiCoin')
const DefiCoinTvl = require('../db/models/DefiCoinTvl')

class DefiCoinSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await DefiCoinTvl.exists()) {
      return
    }

    if (!await DefiCoin.exists()) {
      try {
        await this.syncProtocols(await this.fetchProtocols())
      } catch (e) {
        console.error(e)
      }
    }

    const coins = await DefiCoin.getIds()

    for (let i = 0; i < coins.length; i += 1) {
      try {
        await this.syncProtocol(coins[i])
      } catch (e) {
        console.error(e)
      }
    }
  }

  async syncProtocol(coin) {
    logger.info(`Syncing ${coin.uid}`)

    const data = await defillama.getProtocol(coin.defillama_id)
    const tvls = []

    for (let i = 0; i < data.tvl.length; i += 1) {
      const tvl = data.tvl[i]
      const date = new Date(tvl.date * 1000)
      date.setMinutes(0, 0, 0)

      tvls.push({
        defi_coin_id: coin.id,
        date: date.getTime(),
        tvl: tvl.totalLiquidityUSD
      })
    }

    DefiCoinTvl.bulkCreate(tvls, {
      ignoreDuplicates: true
    }).catch(e => {
      console.error(e)
    })
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
    await DefiCoinTvl.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DefiCoinTvl.deleteExpired(dateFrom, dateTo)
  }

  async syncTvls(protocols, dateTo) {
    const ids = {}
    const tvls = []
    const coins = await DefiCoin.getIds()

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      ids[coin.uid] = coin.id
    }

    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      const coinId = ids[protocol.gecko_id || protocol.slug]

      if (!coinId) {
        continue
      }

      logger.info(`Syncing tvl for ${protocol.gecko_id}`)

      tvls.push({
        defi_coin_id: coinId,
        date: dateTo,
        tvl: protocol.tvl
      })
    }

    await DefiCoinTvl.bulkCreate(tvls, { ignoreDuplicates: true })
  }

  async syncProtocols(protocols) {
    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      const uid = protocol.gecko_id || protocol.slug

      await DefiCoin.upsert({
        uid,
        defillama_id: protocol.slug,
        coingecko_id: protocol.gecko_id,
        tvl: protocol.tvl,
        tvl_rank: i + 1,
        tvl_change: {
          change_1h: protocol.change_1h,
          change_1d: protocol.change_1d,
          change_7d: protocol.change_7d,
          change_30d: null,
        },
        chain_tvls: protocols.chainTvls,
        chains: protocol.chains
      })

      logger.info(`Upsert ${uid}; defillama: ${protocol.gecko_id} coingecko: ${protocol.slug}`)
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
