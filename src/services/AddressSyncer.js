/* eslint-disable no-param-reassign */
const { chunk } = require('lodash')
const { DateTime } = require('luxon')
const bigquery = require('../providers/bigquery')
const bitquery = require('../providers/bitquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const CoinHolder = require('../db/models/CoinHolder')
const Syncer = require('./Syncer')
const logger = require('../config/logger')
const { sleep } = require('../utils')

class AddressSyncer extends Syncer {
  constructor() {
    super()
    this.ADDRESS_DATA_FETCH_PERIOD = { month: 24 }
    this.ADDRESSES_PER_COIN = 20
  }

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if ((await Address.existsForPlatforms(['ethereum', 'erc20'])).count < 1) {
      await this.syncStatsFromBigquery(this.syncParamsHistorical('1d'), '1d')
      await this.syncStatsFromBigquery(this.syncParamsHistorical('4h'), '4h')
      await this.syncStatsFromBigquery(this.syncParamsHistorical('1h'), '1h')
    }

    if ((await Address.existsForPlatforms(['bep20'])).count < 1) {
      await this.syncHistoStatsFromBitquery('bsc')
    }

    if ((await Address.existsForPlatforms(['solana'])).count < 1) {
      await this.syncHistoStatsFromBitquery('solana')
    }

    if (!await CoinHolder.exists()) {
      await this.syncCoinHolders()
    }
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncStatsFromBigquery(dateParams, '1h')
  }

  async syncWeeklyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
    await this.syncFromBitquery(dateParams, 'bsc', true)
    await this.syncFromBitquery(dateParams, 'solana', true)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Address.updatePoints(dateFrom, dateTo)
    await Address.deleteExpired(dateFrom, dateTo)
  }

  async syncStatsFromBigquery({ dateFrom, dateTo }, timePeriod) {
    try {
      const platforms = await this.getPlatforms(['ethereum', 'erc20'], true, false)
      const addressStats = await bigquery.getAddressStats(platforms.tokens, dateFrom, dateTo, timePeriod)

      const result = addressStats.map(data => ({
        count: data.address_count,
        volume: data.volume,
        date: data.block_date.value,
        platform_id: platforms.tokensMap[data.coin_address]
      }))

      this.upsertAddressStats(result)
    } catch (e) {
      logger.error(`Error syncing address stats: ${e}`)
    }
  }

  async syncStatsFromBitquery({ dateFrom, dateTo }, network, chunkSize = 100) {
    try {
      const platforms = await this.getPlatforms(network === 'bsc' ? 'bep20' : network)
      const chunks = chunk(platforms.list, chunkSize)
      const addressStats = []

      for (let i = 0; i < chunks.length; i += 1) {
        const isoDateFrom = dateFrom.toFormat('yyyy-MM-dd')
        const isoDateTo = dateTo.toFormat('yyyy-MM-dd')
        const transfersSenders = await bitquery.getTransferSenders(isoDateFrom, isoDateTo, chunks[i], network)
        const transferReceivers = await bitquery.getTransferReceivers(isoDateFrom, isoDateTo, chunks[i], network)

        const transfers = [...transfersSenders, ...transferReceivers]

        if (transfers.length > 0) {
          const transfersMap = transfers.reduce((map, item) => {
            const currentValue = item.account.address

            if (map[item.currency.address]) {
              if (!map[item.currency.address].find(f => f === currentValue)) {
                map[item.currency.address] = [...[currentValue], ...map[item.currency.address]]
              }
            } else {
              map[item.currency.address] = [currentValue]
            }
            return map;
          }, {});

          Object.keys(transfersMap).forEach(coinAddress => {
            const result = {
              count: transfersMap[coinAddress].length,
              volume: 0,
              date: dateTo.toFormat('yyyy-MM-dd 00:00:00Z'),
              platform_id: platforms.map[coinAddress]
            }
            addressStats.push(result)
          })

          // ------------------------------------------
          sleep(3000) // wait to bypass API limits
          // ------------------------------------------
        }
      }

      this.upsertAddressStats(addressStats)
      logger.info(`Successfully synced adddress stats for date: ${dateTo}`)

    } catch (e) {
      logger.error('Error syncing address stats:', e)
    }
  }

  async syncCoinHolders() {
    try {
      const dateFrom = DateTime.utc().minus(this.ADDRESS_DATA_FETCH_PERIOD).toFormat('yyyy-MM-dd')
      const platforms = await this.getPlatforms()
      const coinHolders = await bigquery.getTopCoinHolders(platforms.tokens, dateFrom, this.ADDRESSES_PER_COIN)

      // ----------Remove previous records ----------
      await CoinHolder.deleteAll()
      // --------------------------------------------

      const holders = coinHolders.map((data) => ({
        address: data.address,
        balance: data.balance,
        platform_id: platforms.tokensMap[data.coin_address]
      }))

      this.upsertCoinHolders(holders)
    } catch (e) {
      logger.error(`Error syncing coin holders: ${e}`)
    }
  }

  async syncHistoStatsFromBitquery(network) {

    logger.info(`Start syncing historical address stats for network ${network}`)

    const date30days = DateTime.utc().minus({ days: 30 })
    let dateTo = DateTime.utc()

    while (date30days <= dateTo) {

      const dateFrom = dateTo.minus({ days: 1 })
      logger.info(`Syncing historical address stats for ${dateFrom} -> ${dateTo}`)

      await this.syncStatsFromBitquery({ dateFrom, dateTo }, network, 50)
      dateTo = dateFrom
    }
  }

  async getPlatforms(types, withDecimals, withAddress = true) {
    const platforms = await Platform.getByTypes(types, withDecimals, withAddress)
    const list = []
    const map = {}

    platforms.forEach(({ type, address, decimals, id }) => {
      if (type === 'ethereum') {
        map.ethereum = id
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

  upsertAddressStats(stats) {
    Address.bulkCreate(stats, {
      updateOnDuplicate: ['count', 'volume', 'date', 'platform_id']
    })
      .then(([address]) => {
        console.log(JSON.stringify(address.dataValues))
      })
      .catch(err => {
        console.error('Error inserting address stats', err.message)
      })
  }

  upsertCoinHolders(holders) {
    CoinHolder.bulkCreate(holders, {
      updateOnDuplicate: ['address', 'balance', 'platform_id']
    })
      .then(([response]) => {
        console.log(JSON.stringify(response.dataValues))
      })
      .catch(err => {
        console.error('Error inserting coin holders', err.message)
      })
  }
}

module.exports = AddressSyncer
