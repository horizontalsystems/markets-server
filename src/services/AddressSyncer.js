/* eslint-disable no-param-reassign */
const { chunk } = require('lodash')
const { utcDate, stringToHex } = require('../utils')
const flipsidecrypto = require('../providers/flipsidecrypto')
const bigquery = require('../providers/bigquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const Syncer = require('./Syncer')

class AddressSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (!await Address.existsForPlatforms('ethereum')) {
      await this.syncStats('ethereum', this.syncParamsHistorical('6M'))
    }

    if (!await Address.existsForPlatforms('bitcoin')) {
      await this.syncStats('bitcoin', this.syncParamsHistorical('1y'))
    }

    if (!await Address.existsForPlatforms('binance-smart-chain')) {
      await this.syncStats('binance-smart-chain', this.syncParamsHistorical('6M'))
    }

    // if (!await Address.existsForPlatforms('solana')) {
    //   await this.syncStats('solana', this.syncParamsHistorical('1y'))
    // }

    console.log('Successfully synced historical address stats !!!')
  }

  async syncLatest() {
    this.cron('1h', this.syncHourlyStats)
    this.cron('1d', this.syncDailyStats)
  }

  async syncHourlyStats() {
    const dateFrom = utcDate({}, 'yyyy-MM-dd')

    await this.syncStats('ethereum', { dateFrom })
    await this.syncStats('bitcoin', { dateFrom })
    await this.syncStats('binance-smart-chain', { dateFrom })
  }

  async syncDailyStats() {
    await this.adjustData()
  }

  async adjustData() {
    await Address.deleteExpired(utcDate({ days: -4 }), utcDate({ days: -1 }), ['1h'])
    await Address.deleteExpired(utcDate({ days: -18 }), utcDate({ days: -14 }), ['4h', '8h'])
  }

  async syncStats(chain, { dateFrom }) {
    try {
      let addressStats = []
      let platforms = {}

      if (chain === 'ethereum') {
        platforms = await this.getPlatforms(chain, true, false)
        addressStats = await flipsidecrypto.getActiveAddresses('999954b1-cb9c-4db0-817a-9316a46a9d84')
      } else if (chain === 'bitcoin') {
        platforms = await this.getPlatforms(['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash'], true, false)
        addressStats = await bigquery.getAddressStatsBtcBased(dateFrom)
      } else if (chain === 'binance-smart-chain') {
        platforms = await this.getPlatforms(chain, true, false)
        addressStats = await flipsidecrypto.getActiveAddresses('3dda0c7d-041e-45a2-ab70-bf646c74f617')
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
        map[stringToHex(chain)] = id
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
      const dateString = i.block_date.value || i.block_date
      const dayOnly = dateString.slice(0, 10)

      map[i.platform] = map[i.platform] || {}
      map[i.platform][dayOnly] = map[i.platform][dayOnly] || {}
      map[i.platform][dayOnly][i.period] = map[i.platform][dayOnly][i.period] || []

      map[i.platform][dayOnly][i.period].push({
        date: dateString,
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
