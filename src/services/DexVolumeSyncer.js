const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
const bigquery = require('../providers/bigquery')
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
    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncStats({ dateFrom, dateTo }, datePeriod) {
    const platforms = await this.getPlatforms()
    const volumesV2 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.tokens, datePeriod, 'uniswap_v2')
    const volumesV3 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.tokens, datePeriod, 'uniswap_v3')
    const volumesSushi = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.tokens, datePeriod, 'sushi')

    const mapVolumes = (items, exchange) => items.map(item => {
      return {
        exchange,
        volume: item.volume,
        date: item.date.value,
        platform_id: platforms.tokensMap[item.address]
      }
    })

    const records = [
      ...mapVolumes(volumesV2, 'uniswap_v2'),
      ...mapVolumes(volumesV3, 'uniswap_v3'),
      ...mapVolumes(volumesSushi, 'sushi')
    ]

    if (!records.length) {
      return
    }

    await DexVolume.bulkCreate(records, { ignoreDuplicates: true })
      .catch(e => {
        console.error('Error inserting dex volumes', e.message)
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
