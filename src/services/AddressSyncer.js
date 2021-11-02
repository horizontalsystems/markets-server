const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const bigquery = require('../db/bigquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const CoinHolder = require('../db/models/CoinHolder')
const AddressRank = require('../db/models/AddressRank')
const Syncer = require('./Syncer')
const logger = require('../config/logger')

class AddressSyncer extends Syncer {
  constructor() {
    super()
    this.ADDRESS_DATA_FETCH_PERIOD = { month: 3 }
    this.ADDRESSES_PER_COIN = 20
  }

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (!(await Address.exists())) {
      await this.syncStats(this.syncParamsHistorical('1d'), '1d')
      await this.syncStats(this.syncParamsHistorical('4h'), '4h')
      await this.syncStats(this.syncParamsHistorical('1h'), '1h')
    }

    if (!(await AddressRank.exists())) {
      await this.syncAddressRanks()
    }

    if (!(await CoinHolder.exists())) {
      await this.syncCoinHolders()
    }
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
    this.cron('10d', this.syncCoinHolders)
  }

  async syncDailyStats(dateParams) {
    await this.syncStats(dateParams, '1h')
    await this.syncAddressRanks()
  }

  async syncWeeklyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Address.updatePoints(dateFrom, dateTo)
    await Address.deleteExpired(dateFrom, dateTo)
  }

  async syncStats({ dateFrom, dateTo }, timePeriod) {
    try {
      const platforms = await this.getPlatforms()
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

  async syncAddressRanks() {
    try {
      const dateFrom = DateTime.utc().minus({ days: 1 }).toFormat('yyyy-MM-dd HH:00:00')
      const platforms = await this.getPlatforms()
      const addressRanks = await bigquery.getTopAddresses(platforms.tokens, dateFrom, this.ADDRESSES_PER_COIN)

      // ----------Remove previous records ----------
      await AddressRank.deleteAll()
      // --------------------------------------------

      const ranks = addressRanks.map((data) => ({
        address: data.address,
        volume: data.volume,
        platform_id: platforms.tokensMap[data.coin_address]
      }))

      this.upsertAddressRanks(ranks)
    } catch (e) {
      logger.error(`Error syncing address ranks: ${e}`)
    }
  }

  async getPlatforms() {
    const tokens = []
    const tokensMap = {}

    const platforms = await Platform.findAll({
      where: {
        type: ['ethereum', 'erc20'],
        decimals: { [Op.not]: null }
      }
    })

    platforms.forEach(({ type, address, decimals, id }) => {
      if (type === 'ethereum') {
        tokensMap.ethereum = id
      } else if (address) {
        tokensMap[address] = id
        tokens.push({
          address,
          decimals
        })
      }
    })

    return {
      tokens,
      tokensMap
    }
  }

  upsertAddressStats(stats) {
    Address.bulkCreate(stats, {
      updateOnDuplicate: ['count', 'volume', 'date', 'platform_id']
    })
      .then(([address]) => {
        console.log(JSON.stringify(address.dataValues))
      })
      .catch((err) => {
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
      .catch((err) => {
        console.error('Error inserting coin holders', err.message)
      })
  }

  upsertAddressRanks(ranks) {
    AddressRank.bulkCreate(ranks, {
      updateOnDuplicate: ['address', 'volume', 'platform_id']
    })
      .then(([response]) => {
        console.log(JSON.stringify(response.dataValues))
      })
      .catch((err) => {
        console.error('Error inserting address ranks', err.message)
      })
  }
}

module.exports = AddressSyncer
