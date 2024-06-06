const { chunk } = require('lodash')
const { utcDate } = require('../utils')
const { bitquery } = require('../providers/bitquery')
const bigquery = require('../providers/bigquery')
const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
const Syncer = require('./Syncer')

class DexVolumeSyncer extends Syncer {
  constructor() {
    super()

    this.spamThreshold = 20000000000 // 20_000_000_000
  }

  async start() {
    // await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical(uids) {
    if (!uids && await DexVolume.exists()) {
      return
    }

    await this.syncFromBigquery(uids, this.syncParamsHistorical('1y'), '1d')
    await this.syncFromBitquery(uids, this.syncParamsHistorical('1y'), 'binance-smart-chain', 'day', 30)
  }

  async syncLatest() {
    this.cron('1d', this.syncDailyStats)
    this.cron('01:00', this.syncDailyStats)
  }

  async syncDailyStats({ dateFrom, dateTo }) {
    const params = {
      dateFrom: utcDate({ days: -1 }, 'yyyy-MM-dd'),
      dateTo: utcDate()
    }

    await this.syncFromBigquery(null, params, '1d')
    await this.syncFromBitquery(null, params, 'binance-smart-chain', 'day', 100)

    await DexVolume.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery(uids, { dateFrom, dateTo }, datePeriod) {
    const platforms = await this.getPlatforms('ethereum', uids)
    const mapVolumes = (items, exchange) => items.map(item => {
      const platform = platforms.map[item.address] || {}
      const price = platform.price || 1
      return {
        exchange,
        volume: item.volume * price,
        date: item.date.value,
        platform_id: platform.id
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

  async syncFromBitquery(uids, { dateFrom }, chain, interval, chunkSize = 100) {
    let exchange

    switch (chain) {
      case 'binance-smart-chain':
        exchange = ['Pancake', 'Pancake v2']
        break
      default:
        return
    }

    const platforms = await this.getPlatforms(chain, uids)
    const chunks = chunk(platforms.list, chunkSize)

    for (let i = 0; i < chunks.length; i += 1) {
      try {
        const dexVolume = await bitquery.getDexVolumes(dateFrom.slice(0, 10), chunks[i], chain, exchange, interval)
        const records = dexVolume.map(item => {
          const platform = platforms.map[item.baseCurrency.address] || {}
          return {
            volume: item.tradeAmount,
            date: item.date.value,
            exchange: exchange[0],
            platform_id: platform.id
          }
        })
        await this.bulkCreate(records)
      } catch (e) {
        console.log(`Error syncing chunk of dex-volume data: ${e}, Ignoring error !!!`)
      }
    }
  }

  async getPlatforms(chain, uids) {
    const platforms = await Platform.getByChainWithPrice(chain, uids)
    const list = []
    const map = {}

    platforms.forEach(({ id, address, decimals, price }) => {
      if (address) {
        map[address] = { id, price }
        list.push({ address, decimals })
      }
    })

    return { list, map }
  }

  async bulkCreate(records) {
    const items = records.filter(item => item.platform_id && item.volume > 0 && item.volume < this.spamThreshold)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

    for (let i = 0; i < chunks.length; i += 1) {
      await DexVolume.bulkCreate(items, { updateOnDuplicate: ['volume'] })
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
