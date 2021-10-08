const { DateTime } = require('luxon')
const DexLiquidity = require('../db/models/DexLiquidity')
const SyncScheduler = require('./SyncScheduler')
const bigquery = require('../db/bigquery')

class DexLiquiditySyncer extends SyncScheduler {

  constructor() {
    super()

    this.on('on-tick-1hour', params => this.sync1HourlyStats(params))
    this.on('on-tick-4hour', params => this.sync4HourlyStats(params))
    this.on('on-tick-1day', params => this.syncDailyStats(params))
  }

  async sync1HourlyStats(params) {
    await this.syncVolumes(
      params.dateFrom,
      params.dateTo,
      params.dateExpiresIn,
      '1h'
    )
    await this.deleteExpired()
  }

  async sync4HourlyStats(params) {
    await this.syncVolumes(
      params.dateFrom,
      params.dateTo,
      params.dateExpiresIn,
      '1h'
    )
  }

  async syncDailyStats(params) {
    await this.syncVolumes(
      params.dateFrom,
      params.dateTo,
      params.dateExpiresIn,
      '1h'
    )
  }

  async deleteExpired() {
    await DexLiquidity.deleteExpired()
  }

  async syncVolumes(dateFrom, dateTo, dateExpiresIn, datePeriod) {
    const platforms = await this.getPlatforms(dateFrom, 'uniswap_v2')
    const liquidityV2 = await bigquery.getDexLiquidity(dateFrom, dateTo, platforms.tokens, datePeriod, 'uniswap_v2_bydate')
    const liquidityV3 = await bigquery.getDexLiquidity(dateFrom, dateTo, platforms.tokens, datePeriod, 'uniswap_v3_bydate')
    const liquiditySushi = await bigquery.getDexLiquidity(dateFrom, dateTo, platforms.tokens, datePeriod, 'sushi_bydate')

    liquidityV2.forEach(liquidity => this.upsertDexLiquidity(
      liquidity.date.value,
      liquidity.volume,
      platforms.tokensMap[liquidity.address],
      dateExpiresIn,
      'uniswap_v2'
    ))

    liquidityV3.forEach(liquidity => this.upsertDexLiquidity(
      liquidity.date.value,
      liquidity.volume,
      platforms.tokensMap[liquidity.address],
      dateExpiresIn,
      'uniswap_v3'
    ))

    liquiditySushi.forEach(liquidity => this.upsertDexLiquidity(
      liquidity.date.value,
      liquidity.volume,
      platforms.tokensMap[liquidity.address],
      dateExpiresIn,
      'sushi'
    ))
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
        console.error('Error inserting dex volume', err.message)
      })
  }

  async getPlatforms(date, exchange) {
    const tokens = []
    const tokensMap = {}
    const platforms = await DexLiquidity.getWithPlatforms(date, exchange)

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
