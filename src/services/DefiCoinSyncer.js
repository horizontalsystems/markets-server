const defillama = require('../providers/defillama')
const logger = require('../config/logger')
const Syncer = require('./Syncer')
const DefiCoin = require('../db/models/DefiCoin')
const DefiCoinTvl = require('../db/models/DefiCoinTvl')
const Coin = require('../db/models/Coin')

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
        await this.syncProtocols(await this.fetchProtocols(), true)
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

  async syncProtocol(defiCoin) {
    logger.info(`Syncing ${defiCoin.defillama_id}; coingecko: ${defiCoin.coingecko_id}`)

    const data = await defillama.getProtocol(defiCoin.defillama_id)
    const tvls = []

    for (let i = 0; i < data.tvl.length; i += 1) {
      const tvl = data.tvl[i]
      const date = new Date(tvl.date * 1000)
      date.setMinutes(0, 0, 0)

      tvls.push({
        defi_coin_id: defiCoin.id,
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
    const defiCoins = await DefiCoin.getIds()

    for (let i = 0; i < defiCoins.length; i += 1) {
      const coin = defiCoins[i]
      ids[coin.defillama_id] = coin.id
    }

    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      const defiCoinId = ids[protocol.slug]

      if (!defiCoinId) {
        continue
      }

      logger.info(`Syncing tvl for slug: ${protocol.slug}; gecko_id: ${protocol.gecko_id}`)

      tvls.push({
        defi_coin_id: defiCoinId,
        date: dateTo,
        tvl: protocol.tvl
      })
    }

    await DefiCoinTvl.bulkCreate(tvls, { ignoreDuplicates: true })
  }

  async syncProtocols(protocols, isInitial) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        uid: protocols.map(item => item.gecko_id).filter(id => id)
      }
    })

    const ids = coins.reduce((memo, coin) => ({ ...memo, [coin.coingecko_id]: coin.id }), {})

    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      const coinId = ids[protocol.gecko_id]

      const values = {
        name: protocol.name,
        logo: protocol.logo,
        coin_id: coinId,
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
        chain_tvls: protocol.chainTvls,
        chains: protocol.chains
      }

      logger.info(`Upserting DefiCoin; Defillama: ${protocol.slug}; Coingecko: ${protocol.gecko_id}`)
      await (isInitial ? DefiCoin.create(values) : DefiCoin.upsert(values))
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
