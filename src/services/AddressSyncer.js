/* eslint-disable no-param-reassign */
const { chunk } = require('lodash')
const { DateTime } = require('luxon')
const dune = require('../providers/dune')
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
    if (!await Address.existsForPlatforms('ethereum')) {
      await this.syncStats('ethereum', this.syncParamsHistorical('1d'))
    }

    if (!await Address.existsForPlatforms('bitcoin')) {
      await this.syncStats('bitcoin', this.syncParamsHistorical('1d'))
    }

    if (!await Address.existsForPlatforms('binance-smart-chain')) {
      await this.syncStats('binance-smart-chain', { dateFrom: utcDate({ days: -15 }, 'yyyy-MM-dd') })
    }

    // if (!await Address.existsForPlatforms('solana')) {
    //   await this.syncStats('solana', this.syncParamsHistorical('1d'))
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
    await this.syncStats('binance-smart-chain', { dateFrom })
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
      let platforms = {}

      if (chain === 'ethereum') {
        platforms = await this.getPlatforms(chain, true, false)
        addressStats = await bigquery.getAddressStats(platforms.list, dateFrom)
      } else if (chain === 'bitcoin') {
        platforms = await this.getPlatforms(['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash'], true, false)
        addressStats = await bigquery.getAddressStatsBtcBased(dateFrom)
      } else if (chain === 'binance-smart-chain') {
        platforms = await this.getPlatforms(chain, true, false)
        addressStats = await dune.getAddressStats(dateFrom)
      }

      const chunks = chunk(addressStats, 200000)

      for (let i = 0; i < chunks.length; i += 1) {
        const data = await this.mapAddressStats(chunks[i], platforms)
        await this.bulkCreate(data)
      }
    } catch (e) {
      console.log('Error syncing address stats', e)
    }
  }

  async getPlatforms(chains, withDecimals, withAddress = true) {
    const platforms = await Platform.getByChain(chains, withDecimals, withAddress)
    const map = {}
    const list = []

    platforms.forEach(({ id, type, chain_uid: chain, address, decimals }) => {
      if (type === 'native') {
        map[chain] = id
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

  async mapAddressStats(addressStats, platforms) {
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

    return Object.keys(addressesMap).flatMap(platform => {
      return Object.keys(addressesMap[platform]).map(date => ({
        date,
        platform_id: platforms.map[platform],
        data: addressesMap[platform][date]
      }))
    })
  }

  async bulkCreate(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    return Address.bulkCreate(items, { updateOnDuplicate: ['data', 'date', 'platform_id'] })
      .then((data) => {
        console.log('Inserted address stats', data.length)
      })
      .catch(err => {
        console.error(err)
      })
  }
}

module.exports = AddressSyncer
