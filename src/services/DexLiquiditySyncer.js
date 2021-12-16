const { utcDate } = require('../utils')
const DexLiquidity = require('../db/models/DexLiquidity')
const bigquery = require('../providers/bigquery')
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

    await this.syncStats(this.syncParamsHistorical('1d'), '1d')
    await this.syncStats(this.syncParamsHistorical('4h'), '4h')
    await this.syncStats(this.syncParamsHistorical('1h'), '1h')
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncStats(dateParams, '1h')
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexLiquidity.deleteExpired(dateFrom, dateTo)
  }

  async syncStats(dateParams, datePeriod) {
    const uniV2Platforms = await DexLiquidity.getWithPlatforms(dateParams.dateFrom, 'uniswap_v2')
    const uniV3platforms = await DexLiquidity.getWithPlatforms(dateParams.dateFrom, 'uniswap_v3')
    const sushiPlatforms = await DexLiquidity.getWithPlatforms(dateParams.dateFrom, 'sushi')

    await this.fetchStats(dateParams, datePeriod, 'uniswap_v2', 'uniswap_v2_bydate', this.mapPlatforms(uniV2Platforms))
    await this.fetchStats(dateParams, datePeriod, 'uniswap_v3', 'uniswap_v3_bydate', this.mapPlatforms(uniV3platforms))
    await this.fetchStats(dateParams, datePeriod, 'sushi', 'sushi_bydate', this.mapPlatforms(sushiPlatforms))
  }

  async syncStatsHistorical(dateParams) {
    const platforms = this.mapPlatforms(await Platform.findErc20())

    await this.fetchStats(dateParams, '1d', 'uniswap_v2', 'uniswap_v2', platforms)
    await this.fetchStats(dateParams, '1d', 'uniswap_v3', 'uniswap_v3', platforms)
    await this.fetchStats(dateParams, '1d', 'sushi', 'sushi', platforms)
  }

  async fetchStats({ dateFrom, dateTo }, datePeriod, exchange, queryType, platforms) {
    const data = await bigquery.getDexLiquidity(
      dateFrom,
      dateTo,
      datePeriod,
      platforms.tokens,
      queryType
    )

    const records = data
      .map(item => ({
        date: item.date.value,
        volume: item.volume,
        exchange,
        platform_id: platforms.tokensMap[item.address]
      }))
      .filter(item => item.platform_id)

    return DexLiquidity.bulkCreate(records, { ignoreDuplicates: true })
      .catch(e => {
        console.error('Error inserting dex liquidity', e.message)
      })
  }

  mapPlatforms(platforms) {
    const tokens = []
    const tokensMap = {}

    platforms.forEach(({ id, address, decimals, volume }) => {
      tokensMap[address] = id
      tokens.push({
        address,
        decimals,
        volume
      })
    })

    return {
      tokens,
      tokensMap
    }
  }

}

module.exports = DexLiquiditySyncer
