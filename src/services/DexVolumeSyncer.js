const { DateTime } = require('luxon')
const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
const SyncScheduler = require('./SyncScheduler')
const bigquery = require('../db/bigquery')

class DexVolumeSyncer extends SyncScheduler {

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
    await DexVolume.deleteExpired()
  }

  async syncVolumes(dateFrom, dateTo, dateExpiresIn, datePeriod) {
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

    volumesV3.forEach(transfer => {
      return this.upsertDexVolume(
        transfer.date.value,
        transfer.volume,
        platforms.tokensMap[transfer.address],
        dateExpiresIn,
        'uniswap_v3'
      )
    })

    volumesSushi.forEach(transfer => {
      return this.upsertDexVolume(
        transfer.date.value,
        transfer.volume,
        platforms.tokensMap[transfer.address],
        dateExpiresIn,
        'sushi'
      )
    })
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
