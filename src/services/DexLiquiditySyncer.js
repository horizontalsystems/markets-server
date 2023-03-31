const { chunk } = require('lodash')
const { utcDate, utcStartOfDay } = require('../utils')
const DexLiquidity = require('../db/models/DexLiquidity')
const DexVolume = require('../db/models/DexVolume')
const dune = require('../providers/dune')
const pancakeGraph = require('../providers/pancake-graph')
const uniswapGraph = require('../providers/uniswap-graph')
const Platform = require('../db/models/Platform')
const Syncer = require('./Syncer')

class DexLiquiditySyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical(uids, source) {
    if (!uids && await DexLiquidity.exists()) {
      return
    }

    const dateFrom = utcStartOfDay({ month: -12 }, true)

    if (source === 'uniswap-v3') {
      return this.syncUniswap(dateFrom, true, true, uids)
    }
    if (source === 'uniswap-v2') {
      return this.syncUniswap(dateFrom, false, true, uids)
    }
    if (source === 'pancakeswap') {
      return this.syncPancakeswap(dateFrom, true, uids)
    }
    if (source === 'dune') {
      return this.syncFromDune(utcDate({ month: -1 }, 'yyyy-MM-dd'))
    }

    await this.syncFromDune(utcDate({ month: -1 }, 'yyyy-MM-dd'))
    await this.syncUniswap(dateFrom, true, true, uids)
    await this.syncUniswap(dateFrom, false, true, uids)
    await this.syncPancakeswap(dateFrom, true, uids)
  }

  async syncLatest() {
    this.cron('1h', this.syncHourlyStats)
    this.cron('1d', this.syncDailyStats)
  }

  async syncHourlyStats({ dateTo }) {
    await this.syncUniswap(dateTo, true, false)
    await this.syncUniswap(dateTo, false, false)
    await this.syncPancakeswap(dateTo, false)
  }

  async syncDailyStats(dateParams) {
    await this.syncFromDune(utcDate({ days: -2 }, 'yyyy-MM-dd'))
    await this.adjustData(dateParams)
  }

  async adjustData({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
  }

  async syncPancakeswap(dateFrom, isHistory, uids, chunkSize = 50) {
    const platforms = await this.getPlatforms('binance-smart-chain', uids)
    const chunks = chunk(platforms.list, chunkSize)

    for (let i = 0; i < chunks.length; i += 1) {
      try {
        const data = isHistory
          ? await pancakeGraph.getLiquidityHistory(dateFrom, chunks[i])
          : await pancakeGraph.getLiquidityNow(chunks[i])

        await this.upsertHistoryData(data, platforms.map, 'pancakeswap', dateFrom, isHistory)
      } catch (e) {
        console.log(`Error syncing chunk of pancake data: ${e}, Ignoring error`, (e.parent || {}).message)
      }
    }
  }

  async syncUniswap(dateFrom, isV3, isHistory, uids, chunkSize = 50) {
    const platforms = await this.getPlatforms('ethereum', uids)
    const chunks = chunk(platforms.list, chunkSize)

    for (let i = 0; i < chunks.length; i += 1) {
      try {
        let data
        if (isHistory) {
          data = await uniswapGraph.getLiquidityHistory(dateFrom, chunks[i], isV3)
        } else if (isV3) {
          data = await uniswapGraph.getLiquidity(chunks[i], isV3)
        } else {
          data = await uniswapGraph.getLiquidityNow(chunks[i], isV3)
        }

        const exchange = isV3 ? 'uniswap-v3' : 'uniswap-v2'
        await this.upsertHistoryData(data, platforms.map, exchange, dateFrom, isHistory)
      } catch (e) {
        console.log(`Error syncing chunk of uniswap-v2/v3 data: ${e}, Ignoring error`, (e.parent || {}).message)
      }
    }
  }

  async syncFromDune(dateFrom) {
    const platforms = await this.getPlatforms('ethereum', null)
    const data = await dune.getDexLiquidity(dateFrom)

    const records = data.map(item => {
      const platform = platforms.map[item.platform.toLowerCase()] || {}
      return {
        date: item.date,
        volume: item.liquidity,
        exchange: item.exchange,
        platform_id: platform.id
      }
    })

    await this.upsertLiquidity(records)
  }

  async getPlatforms(chains, uids) {
    const platforms = await Platform.getByChainWithPrice(chains, uids)
    const map = {}
    const list = []

    platforms.forEach(({ id, address, price }) => {
      if (address) {
        const addr = address.toLowerCase()
        list.push({ address: addr })
        map[addr] = { id, price }
      }
    })

    return { list, map }
  }

  async upsertHistoryData(records, platformMap, exchange, dateTo, isHistory) {
    const volumes = []
    const liquidity = []

    for (let i = 0; i < records.length; i += 1) {
      const item = records[i];
      const date = isHistory ? (item.date * 1000) : dateTo
      const platform = platformMap[item.address.toLowerCase()] || {}

      liquidity.push({ date, exchange, volume: item.liquidityUSD, platform_id: platform.id })

      if (isHistory) {
        volumes.push({ date, exchange, volume: item.volumeUSD, platform_id: platform.id })
      }
    }

    await this.upsertLiquidity(liquidity)

    if (isHistory) {
      await this.upsertVolumes(volumes)
    }
  }

  async upsertLiquidity(records) {
    const items = records.filter(item => item.platform_id && item.volume > 0)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

    for (let i = 0; i < chunks.length; i += 1) {
      await DexLiquidity.bulkCreate(chunks[i], { updateOnDuplicate: ['date', 'platform_id', 'exchange'] })
        .then((data) => {
          console.log('Inserted dex liquidity', data.length)
        })
        .catch(e => {
          console.error('Error inserting dex liquidity', e.message)
        })
    }
  }

  async upsertVolumes(records) {
    const items = records.filter(item => item.platform_id && item.volume > 0)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

    for (let i = 0; i < chunks.length; i += 1) {
      await DexVolume.bulkCreate(chunks[i], { updateOnDuplicate: ['date', 'platform_id', 'exchange'] })
        .then(data => {
          console.log('Inserted dex volumes', data.length)
        })
        .catch(e => {
          console.error('Error inserting dex volumes', e.message)
        })
    }
  }
}

module.exports = DexLiquiditySyncer
