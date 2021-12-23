const { chunk } = require('lodash')
const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
const bigquery = require('../providers/bigquery')
const bitquery = require('../providers/bitquery')
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

    await this.syncFromBigquery(this.syncParamsHistorical('1d'), '1d')
    await this.syncFromBigquery(this.syncParamsHistorical('4h'), '4h')
    await this.syncFromBigquery(this.syncParamsHistorical('1h'), '1h')

    await this.syncFromBitquery(this.syncParamsHistorical('1d'), 'bsc', 'day')
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncFromBigquery(dateParams, '1h')
    await this.syncFromBitquery(dateParams, 'bsc', 'hour')
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery({ dateFrom, dateTo }, datePeriod) {
    const platforms = await this.getPlatforms('erc20', true)
    const volumesV2 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.list, datePeriod, 'uniswap_v2')
    const volumesV3 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.list, datePeriod, 'uniswap_v3')
    const volumesSushi = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.list, datePeriod, 'sushi')

    const mapVolumes = (items, exchange) => items.map(item => {
      return {
        exchange,
        volume: item.volume,
        date: item.date.value,
        platform_id: platforms.map[item.address]
      }
    })

    const records = [
      ...mapVolumes(volumesV2, 'uniswap_v2'),
      ...mapVolumes(volumesV3, 'uniswap_v3'),
      ...mapVolumes(volumesSushi, 'sushi')
    ]

    await this.bulkCreate(records)
  }

  async syncFromBitquery({ dateFrom }, network, interval) {
    let type
    let exchange

    switch (network) {
      case 'bsc':
        type = 'bep20'
        exchange = ['Pancake', 'Pancake v2']
        break
      default:
        return
    }

    const platforms = await this.getPlatforms(type)
    const chunks = chunk(platforms.list, 100)

    for (let i = 0; i < chunks.length; i += 1) {
      const dexVolume = await bitquery.getDexVolumes(dateFrom.slice(0, 10), chunks[i], network, exchange, interval)
      const records = dexVolume.map(item => {
        return {
          volume: item.tradeAmount,
          date: item.date.value,
          exchange: exchange[0],
          platform_id: platforms.map[item.baseCurrency.address]
        }
      })

      await this.bulkCreate(records)
    }
  }

  async getPlatforms(type, withDecimals) {
    const platforms = (await Platform.getByTypes(type))
    const list = []
    const map = {}

    platforms.forEach(({ address, decimals, id }) => {
      if (address) {
        map[address] = id

        if (!withDecimals) {
          list.push({ address })
        } else if (decimals) {
          list.push({ address, decimals })
        }
      }
    })

    return { list, map }
  }

  bulkCreate(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    return DexVolume.bulkCreate(items, { ignoreDuplicates: true })
      .then(data => {
        console.log('Inserted dex volumes', data.length)
      })
      .catch(e => {
        console.error('Error inserting dex volumes', e.message)
      })
  }

}

module.exports = DexVolumeSyncer
