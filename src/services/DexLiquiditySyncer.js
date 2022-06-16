const { chunk } = require('lodash')
const { utcDate, utcStartOfDay } = require('../utils')
const DexLiquidity = require('../db/models/DexLiquidity')
const bigquery = require('../providers/bigquery')
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

    await this.syncStatsHistorical({
      dateFrom: '2020-01-01',
      dateTo: utcDate({ month: -12 }, 'yyyy-MM-dd')
    })

    await this.syncFromBigquery({ dateFrom: utcDate({ month: -12 }, 'yyyy-MM-dd'), dateTo: utcDate({ month: -8 }, 'yyyy-MM-dd') }, '1d')
    await this.syncFromBigquery({ dateFrom: utcDate({ month: -8 }, 'yyyy-MM-dd'), dateTo: utcDate({ month: -4 }, 'yyyy-MM-dd') }, '1d')
    await this.syncFromBigquery({ dateFrom: utcDate({ month: -4 }, 'yyyy-MM-dd'), dateTo: utcDate({ days: -7 }, 'yyyy-MM-dd') }, '1d')
    await this.syncFromBigquery(this.syncParamsHistorical('30m'), '30m')

    await this.syncFromStreamingfast(utcStartOfDay({ month: -12 }), 33)
  }

  async syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncFromBigquery(dateParams, '30m')
    await this.syncFromStreamingfast(utcStartOfDay())
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery(dateParams, datePeriod) {
    const uniV2Platforms = await DexLiquidity.getWithPlatforms(dateParams.dateFrom, 'uniswap_v2')
    const uniV3platforms = await DexLiquidity.getWithPlatforms(dateParams.dateFrom, 'uniswap_v3')
    const sushiPlatforms = await DexLiquidity.getWithPlatforms(dateParams.dateFrom, 'sushi')

    await this.fetchFromBigquery(dateParams, datePeriod, 'uniswap_v2', 'uniswap_v2_bydate', this.mapPlatforms(uniV2Platforms))
    await this.fetchFromBigquery(dateParams, datePeriod, 'uniswap_v3', 'uniswap_v3_bydate', this.mapPlatforms(uniV3platforms))
    await this.fetchFromBigquery(dateParams, datePeriod, 'sushi', 'sushi_bydate', this.mapPlatforms(sushiPlatforms))
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

  async syncStatsHistorical(dateParams) {
    const platforms = this.mapPlatforms(await Platform.getByChain('ethereum', true))
    const chunkSize = platforms.list.length

    await this.fetchFromBigquery(dateParams, '1d', 'uniswap_v2', 'uniswap_v2', platforms, chunkSize)
    await this.fetchFromBigquery(dateParams, '1d', 'uniswap_v3', 'uniswap_v3', platforms)
    await this.fetchFromBigquery(dateParams, '1d', 'sushi', 'sushi', platforms)
  }

  async fetchFromBigquery({ dateFrom, dateTo }, datePeriod, exchange, queryType, platforms, chunkSize = 3000) {
    const chunks = chunk(platforms.list, chunkSize || platforms.list.length)

    for (let i = 0; i < chunks.length; i += 1) {
      const data = await bigquery.getDexLiquidity(
        dateFrom,
        dateTo,
        datePeriod,
        chunks[i],
        queryType
      )

      const records = data.map(item => {
        return {
          date: item.date.value,
          volume: item.volume,
          exchange,
          platform_id: platforms.map[item.address]
        }
      })

      await this.bulkCreate(records)
    }
  }

  mapPlatforms(platforms) {
    const list = []
    const map = {}

    platforms.forEach(({ id, address, decimals, volume }) => {
      map[address] = id
      list.push({
        address,
        decimals,
        volume
      })
    })

    return { list, map }
  }

  bulkCreate(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    return DexLiquidity.bulkCreate(records, { ignoreDuplicates: true })
      .then(data => {
        console.log('Inserted dex liquidity', data.length)
      })
      .catch(e => {
        console.error('Error inserting dex liquidity', e.message)
      })
  }

}

module.exports = DexLiquiditySyncer
