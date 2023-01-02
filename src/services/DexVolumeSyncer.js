const { chunk } = require('lodash')
const { bitquery } = require('../providers/bitquery')
const bigquery = require('../providers/bigquery')
const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
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

    await this.syncFromBigquery(this.syncParamsHistorical('1y', { days: -30 }), '1d')
    await this.syncFromBigquery(this.syncParamsHistorical('1M'), '1h')

    await this.syncFromBitquery(this.syncParamsHistorical('1y'), 'binance-smart-chain', 'day', 30)
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStatsBigquery)
    this.cron('1h', this.syncDailyStatsBitquery)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStatsBigquery(dateParams) {
    await this.syncFromBigquery(dateParams, '1h')
  }

  async syncDailyStatsBitquery(dateParams) {
    await this.syncFromBitquery(dateParams, 'binance-smart-chain', 'hour', 100)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery({ dateFrom, dateTo }, datePeriod) {
    const platforms = await this.getPlatforms('ethereum', true)
    const mapVolumes = (items, exchange) => items.map(item => {
      return {
        exchange,
        volume: item.volume,
        date: item.date.value,
        platform_id: platforms.map[item.address]
      }
    })

    try {
      const volumesV2 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.list, datePeriod, 'uniswap_v2')
      await this.bulkCreate(mapVolumes(volumesV2, 'uniswap_v2'))
      const volumesV3 = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.list, datePeriod, 'uniswap_v3')
      await this.bulkCreate(mapVolumes(volumesV3, 'uniswap_v3'))
      const volumesSushi = await bigquery.getDexVolumes(dateFrom, dateTo, platforms.list, datePeriod, 'sushi')
      await this.bulkCreate(mapVolumes(volumesSushi, 'sushi'))
    } catch (e) {
      console.log('Error fetching dex volumes', e.message, { dateFrom, dateTo, datePeriod, tokens: platforms.list.length })
    }
  }

  async syncFromBitquery({ dateFrom }, chain, interval, chunkSize = 100) {
    let exchange

    switch (chain) {
      case 'binance-smart-chain':
        exchange = ['Pancake', 'Pancake v2']
        break
      default:
        return
    }

    const platforms = await this.getPlatforms(chain)
    const chunks = chunk(platforms.list, chunkSize)

    for (let i = 0; i < chunks.length; i += 1) {
      try {
        const dexVolume = await bitquery.getDexVolumes(dateFrom.slice(0, 10), chunks[i], chain, exchange, interval)
        const records = dexVolume.map(item => {
          return {
            volume: item.tradeAmount,
            date: item.date.value,
            exchange: exchange[0],
            platform_id: platforms.map[item.baseCurrency.address]
          }
        })
        await this.bulkCreate(records)
      } catch (e) {
        console.log(`Error syncing chunk of dex-volume data: ${e}, Ignoring error !!!`)
      }
    }
  }

  async getPlatforms(chain, withDecimals) {
    const platforms = await Platform.getByChain(chain)
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

  async bulkCreate(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

    for (let i = 0; i < chunks.length; i += 1) {
      await DexVolume.bulkCreate(items, { ignoreDuplicates: true })
        .then(data => {
          console.log('Inserted dex volumes', data.length)
        })
        .catch(e => {
          console.error('Error inserting dex volumes', e.message)
        })
    }
  }

}

module.exports = DexVolumeSyncer
