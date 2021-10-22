const { DateTime } = require('luxon')
const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
const bigquery = require('../db/bigquery')
const Syncer = require('./Syncer')

class DexVolumeSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await DexVolume.exists()) {
      return
    }

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
    this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncStats({ dateFrom, dateTo, dateExpiresIn }, datePeriod) {
    const platforms = await this.getPlatforms()
    const volumesV2 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.tokens, datePeriod, 'uniswap_v2')
    const volumesV3 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.tokens, datePeriod, 'uniswap_v3')
    const volumesSushi = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.tokens, datePeriod, 'sushi')

    volumesV2.forEach(transfer => {
      return this.upsertDexVolume(
        transfer.date.value,
        transfer.volume,
        platforms.tokensMap[transfer.address],
        dateExpiresIn,
        'uniswap_v2'
      )
    })

    volumesV3.forEach(transfer => this.upsertDexVolume(
      transfer.date.value,
      transfer.volume,
      platforms.tokensMap[transfer.address],
      dateExpiresIn,
      'uniswap_v3'
    ))

    volumesSushi.forEach(transfer => this.upsertDexVolume(
      transfer.date.value,
      transfer.volume,
      platforms.tokensMap[transfer.address],
      dateExpiresIn,
      'sushi'
    ))
  }

  upsertDexVolume(date, volume, platformId, expireDuration, exchange) {
    let expiresAt = null
    if (expireDuration) {
      expiresAt = DateTime.fromISO(date)
        .plus(expireDuration)
    }

    DexVolume.upsert({
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

  async getPlatforms() {
    const tokensMap = {}
    const tokens = []

    const platforms = await Platform.findErc20()

    platforms.forEach(({ address, decimals, id }) => {
      tokensMap[address] = id
      tokens.push({
        address,
        decimals
      })
    })

    return {
      tokens,
      tokensMap
    }
  }

}

module.exports = DexVolumeSyncer
