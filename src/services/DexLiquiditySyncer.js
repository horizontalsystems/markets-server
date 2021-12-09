const { DateTime } = require('luxon')
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

    await this.syncMonthlyStats(this.syncParamsHistorical('1d'), '1d')
    await this.syncWeeklyStats(this.syncParamsHistorical('4h'), '4h')
    await this.syncDailyStats(this.syncParamsHistorical('1h'), '1h')
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncStats(dateParams, '1h')
  }

  async syncWeeklyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
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
    console.log('syncStatsHistorical')
    const platforms = this.mapPlatforms(await Platform.findErc20())

    await this.fetchStats(dateParams, '1d', 'uniswap_v2', 'uniswap_v2', platforms)
    await this.fetchStats(dateParams, '1d', 'uniswap_v3', 'uniswap_v3', platforms)
    await this.fetchStats(dateParams, '1d', 'sushi', 'sushi', platforms)
  }

  async fetchStats({ dateFrom, dateTo, dateExpiresIn }, datePeriod, exchange, queryType, platforms) {
    const records = await bigquery.getDexLiquidity(
      dateFrom,
      dateTo,
      datePeriod,
      platforms.tokens,
      queryType
    )

    records.forEach(record => this.upsertDexLiquidity(
      record.date.value,
      record.volume,
      platforms.tokensMap[record.address],
      dateExpiresIn,
      exchange
    ))
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

  upsertDexLiquidity(date, volume, platformId, expireDuration, exchange) {
    let expiresAt = null
    if (expireDuration) {
      expiresAt = DateTime.fromISO(date)
        .plus(expireDuration)
    }

    DexLiquidity.upsert({
      date,
      volume,
      exchange,
      expires_at: expiresAt,
      platform_id: platformId
    })
      .then(([dexVolume]) => {
        console.log(JSON.stringify(dexVolume.dataValues))
      })
      .catch(err => {
        console.error('Error inserting dex liquidity', err.message)
      })
  }

}

module.exports = DexLiquiditySyncer
