/* eslint-disable no-param-reassign */
const { chunk } = require('lodash')
const { DateTime } = require('luxon')
const { dune } = require('../providers/dune')
const bigquery = require('../providers/bigquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const Syncer = require('./Syncer')
const { utcDate } = require('../utils')

class AddressSyncer extends Syncer {
  constructor() {
    super()
    this.BUSDT_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'
  }

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (!await Address.existsForPlatforms(['ethereum', 'erc20'])) {
      await this.syncStats('ethereum', this.syncParamsHistorical('1d'))
    }

    if (!await Address.existsForPlatforms(['bitcoin'])) {
      await this.syncStats('bitcoin', this.syncParamsHistorical('1d'))
    }

    if (!await Address.existsForPlatforms(['bep20'])) {
      await this.syncStats('bsc', this.syncParamsHistorical('30m'), true)
    }

    // if (!await Address.existsForPlatforms(['solana'])) {
    //   await this.syncStats('solana', this.syncParamsHistorical('1d'), true)
    // }

    console.log('Successfully synced historical address stats !!!')
  }

  async syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats() {
    const dateFrom = utcDate({}, 'yyyy-MM-dd')

    await this.syncStats('ethereum', { dateFrom })
    await this.syncStats('bitcoin', { dateFrom })
    // await this.syncStats('bsc', { dateFrom })
  }

  async syncMonthlyStats() {
    await this.adjustPoints()
  }

  async adjustPoints() {
    await Address.deleteExpired(utcDate({ days: -4 }), utcDate({ days: -1 }), ['30m'])
    await Address.deleteExpired(utcDate({ days: -18 }), utcDate({ days: -14 }), ['4h', '8h'])
  }

  async syncStats(chain, { dateFrom }) {
    try {
      let addressStats = []
      const platforms = await this.getPlatforms(chain, true, false)

      if (chain === 'ethereum') {
        addressStats = await bigquery.getAddressStats(platforms.list, dateFrom)
      } else if (chain === 'bitcoin') {
        addressStats = await bigquery.getAddressStatsBtcBased(dateFrom)
      } else if (chain === 'bsc') {
        addressStats = await dune.getAddressStats(dateFrom)
      }

      const addressesMap = addressStats.reduce((map, i) => {
        const isoBlockDate = i.block_date.value ? i.block_date.value : i.block_date
        const date = DateTime.fromISO(isoBlockDate, { zone: 'utc' }).toFormat('yyyy-MM-dd');

        map[i.platform] = map[i.platform] || {}
        map[i.platform][date] = map[i.platform][date] || {}
        map[i.platform][date][i.period] = map[i.platform][date][i.period] || []

        map[i.platform][date][i.period].push({
          date: isoBlockDate,
          count: i.address_count
        })

        return map
      }, {})

      const records = Object.keys(addressesMap).flatMap(platform => {
        return Object.keys(addressesMap[platform]).map(date => ({
          date,
          platform_id: platforms.map[platform],
          data: addressesMap[platform][date]
        }))
      })

      await this.upsertAddressStats(records)
    } catch (e) {
      console.log('Error syncing address stats', e)
    }
  }

  async getPlatforms(chain, withDecimals, withAddress = true) {
    const chains = ['bitcoin', 'ethereum', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash']
    let types = ['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash', 'ethereum', 'erc20']

    if (chain === 'bsc') {
      types = ['bep20']
    }

    const platforms = await Platform.getByTypes(types, withDecimals, withAddress)
    const map = {}
    const list = []

    platforms.forEach(({ type, address, decimals, id }) => {
      if (chains.includes(type)) {
        map[type] = id
      }

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

  async upsertAddressStats(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 400000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Address.bulkCreate(chunks[i], { updateOnDuplicate: ['data', 'date', 'platform_id'] })
        .then((data) => {
          console.log('Inserted address stats', data.length)
        })
        .catch(err => {
          console.error(err)
        })
    }
  }
}

module.exports = AddressSyncer
