const { chunk } = require('lodash')
const { utcDate, utcStartOfDay } = require('../utils')
const DexLiquidity = require('../db/models/DexLiquidity')
const dune = require('../providers/dune')
const streamingfast = require('../providers/streamingfast')
const Platform = require('../db/models/Platform')
const Syncer = require('./Syncer')

class DexLiquiditySyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await DexLiquidity.exists()) {
      return
    }

    await this.syncFromDune(utcDate({ month: -1 }, 'yyyy-MM-dd'))
    await this.syncFromStreamingfast(utcStartOfDay({ month: -12 }), 33)
  }

  async syncLatest() {
    this.cron('1d', this.syncDailyFromDune)
    this.cron('30m', this.syncDailyFromStreamingfast)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyFromStreamingfast() {
    await this.syncFromStreamingfast(utcStartOfDay())
  }

  async syncDailyFromDune() {
    await this.syncFromDune(utcStartOfDay())
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
  }

  async syncFromStreamingfast(dateFrom, chunkSize = 100) {
    const platforms = this.mapPlatforms(await Platform.getByChain('binance-smart-chain'))
    const chunks = chunk(platforms.list, chunkSize)

    for (let i = 0; i < chunks.length; i += 1) {
      const data = await streamingfast.getPancakeLiquidity(dateFrom, chunks[i])
      const records = data.map(item => {
        return {
          volume: item.volume,
          date: item.date * 1000,
          exchange: 'pancakeswap',
          platform_id: platforms.map[item.token.id]
        }
      })

      await this.bulkCreate(records)
    }
  }

  async syncFromDune(dateFrom) {

    const platforms = await this.getPlatforms(['ethereum', 'binance-smart-chain'], false)
    const data = await dune.getDexLiquidity(dateFrom)

    const records = data.map(item => {
      return {
        date: item.date,
        volume: item.liquidity,
        exchange: item.exchange,
        platform_id: platforms.map[item.platform]
      }
    })

    await this.upsertData(records)
  }

  async getPlatforms(chains, withDecimals, withAddress = true) {
    const platforms = await Platform.getByChain(chains, withDecimals, withAddress)
    const map = {}
    const list = []

    platforms.forEach(({ id, type, chain_uid: chain, address, decimals }) => {
      if (type === 'native') {
        map[chain] = id
      }

      if (address) {
        map[address] = id

        if (!withDecimals) {
          list.push({ address })
        } else if (decimals) {
          list.push({ address, decimals })
        }
      }
    })

    return { list, map }
  }

  async upsertData(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 400000)

    for (let i = 0; i < chunks.length; i += 1) {
      await DexLiquidity.bulkCreate(chunks[i], { updateOnDuplicate: ['volume', 'date', 'platform_id'] })
        .then((data) => {
          console.log('Inserted dex liquidity', data.length)
        })
        .catch(e => {
          console.error('Error inserting dex liquidity', e.message)
        })
    }
  }

}

module.exports = DexLiquiditySyncer
