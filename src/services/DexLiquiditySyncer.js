const { chunk } = require('lodash')
const { utcDate, utcStartOfDay } = require('../utils')
const DexLiquidity = require('../db/models/DexLiquidity')
const dune = require('../providers/dune')
const pancakeGraph = require('../providers/pancake-graph')
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
    await this.syncFromGraph(utcStartOfDay({ month: -12 }, true), true)
  }

  async syncLatest() {
    this.cron('1d', this.syncDailyFromDune)
    this.cron('30m', this.syncDailyFromGraph)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyFromGraph({ dateTo }) {
    await this.syncFromGraph(dateTo, false)
  }

  async syncDailyFromDune() {
    await this.syncFromDune(utcStartOfDay())
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
  }

  async syncFromGraph(dateFrom, isHistory, chunkSize = 50) {
    const platforms = await this.getPlatforms(['binance-smart-chain'])
    const chunks = chunk(platforms.list, chunkSize)

    for (let i = 0; i < chunks.length; i += 1) {
      try {
        const data = isHistory
          ? await pancakeGraph.getLiquidityHistory(dateFrom, chunks[i])
          : await pancakeGraph.getLiquidity(chunks[i])

        const records = data.map(item => {
          return {
            volume: item.volume,
            date: isHistory ? (item.date * 1000) : dateFrom,
            exchange: 'pancakeswap',
            platform_id: platforms.map[item.address.toLowerCase()]
          }
        })
        await this.upsertData(records)
      } catch (e) {
        console.log(`Error syncing chunk of pancake data: ${e}, Ignoring error`, (e.parent || {}).message)
      }
    }
  }

  async syncFromDune(dateFrom) {
    const platforms = await this.getPlatforms(['ethereum'])
    const data = await dune.getDexLiquidity(dateFrom)

    const records = data.map(item => {
      return {
        date: item.date,
        volume: item.liquidity,
        exchange: item.exchange,
        platform_id: platforms.map[item.platform.toLowerCase()]
      }
    })

    await this.upsertData(records)
  }

  async getPlatforms(chains) {
    const platforms = await Platform.getByChain(chains, false, true)
    const map = {}
    const list = []

    platforms.forEach(({ id, type, chain_uid: chain, address }) => {
      if (type === 'native') {
        map[chain] = id
      }

      if (address) {
        const addr = address.toLowerCase()
        map[addr] = id
        list.push({ address: addr })
      }
    })

    return { list, map }
  }

  async upsertData(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

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
