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
      dateTo: utcDate('yyyy-MM-dd', { days: -30 })
    })

    await this.syncFromBigquery(this.syncParamsHistorical('1d'), '1d')
    await this.syncFromBigquery(this.syncParamsHistorical('4h'), '4h')
    await this.syncFromBigquery(this.syncParamsHistorical('1h'), '1h')

    await this.syncFromStreamingfast(utcStartOfDay({ days: -30 }), 33)
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncFromBigquery(dateParams, '1h')
    await this.syncFromStreamingfast(utcStartOfDay())
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
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
    const platforms = this.mapPlatforms(await Platform.getByTypes('bep20'))
    const coins = chunk(platforms.list, chunkSize)

    for (let i = 0; i < coins.length; i += 1) {
      const data = await streamingfast.getPancakeLiquidity(dateFrom, coins[i])
      const records = data.map(item => {
        return {
          volume: item.volume,
          date: item.date,
          exchange: 'pancakeswap',
          platform_id: platforms.map[item.token.id]
        }
      })

      await this.bulkCreate(records)
    }
  }

  async syncStatsHistorical(dateParams) {
    const platforms = this.mapPlatforms(await Platform.getByTypes('erc20', true))

    await this.fetchFromBigquery(dateParams, '1d', 'uniswap_v2', 'uniswap_v2', platforms)
    await this.fetchFromBigquery(dateParams, '1d', 'uniswap_v3', 'uniswap_v3', platforms)
    await this.fetchFromBigquery(dateParams, '1d', 'sushi', 'sushi', platforms)
  }

  async fetchFromBigquery({ dateFrom, dateTo }, datePeriod, exchange, queryType, platforms) {
    const data = await bigquery.getDexLiquidity(
      dateFrom,
      dateTo,
      datePeriod,
      platforms.list,
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

    return this.bulkCreate(records)
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
