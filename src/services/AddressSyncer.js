const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const bigquery = require('../db/bigquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const CoinHolder = require('../db/models/CoinHolder')
const AddressRank = require('../db/models/AddressRank')
const Syncer = require('./Syncer')

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
    if (!await Address.exists()) {
      await this.syncStats(this.syncParamsHistorical('1d'), '1d')
      await this.syncStats(this.syncParamsHistorical('4h'), '4h')
      await this.syncStats(this.syncParamsHistorical('1h'), '1h')
    }

    if (!await AddressRank.exists()) {
      await this.syncAddressRanks()
    }

    if (!await CoinHolder.exists()) {
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
    this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Address.updatePoints(dateFrom, dateTo)
    await Address.deleteExpired(dateFrom, dateTo)
  }

  async syncStats({ dateFrom, dateTo, dateExpiresIn }, timePeriod) {
    const platforms = await this.getPlatforms()
    const addressStats = await bigquery.getAddressStats(platforms.tokens, dateFrom, dateTo, timePeriod)

    addressStats.forEach(data => {
      return this.upsertAddressStats(
        data.address_count,
        data.volume,
        data.block_date.value,
        platforms.tokensMap[data.coin_address],
        dateExpiresIn
      )
    })
  }

  async syncCoinHolders() {
    const dateFrom = DateTime.utc()
      .minus(this.ADDRESS_DATA_FETCH_PERIOD)
      .toFormat('yyyy-MM-dd')
    const platforms = await this.getPlatforms()
    const coinHolders = await bigquery.getTopCoinHolders(platforms.tokens, dateFrom, this.ADDRESSES_PER_COIN)

    // ----------Remove previous records ----------
    await CoinHolder.deleteAll()
    // --------------------------------------------

    coinHolders.forEach(data => {
      return this.upsertCoinHolders(
        data.address,
        data.balance,
        platforms.tokensMap[data.coin_address]
      )
    })
  }

  async syncAddressRanks() {
    const dateFrom = DateTime.utc()
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd HH:00:00')
    const platforms = await this.getPlatforms()
    const addressRanks = await bigquery.getTopAddresses(platforms.tokens, dateFrom, this.ADDRESSES_PER_COIN)

    // ----------Remove previous records ----------
    await AddressRank.deleteAll()
    // --------------------------------------------

    addressRanks.forEach(data => {
      return this.upsertAddressRanks(
        data.address,
        data.volume,
        platforms.tokensMap[data.coin_address]
      )
    })
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

  upsertAddressStats(count, volume, date, platformId, expireDuration) {
    const dateExpire = expireDuration ? DateTime.fromISO(date).plus(expireDuration) : null

    Address.upsert({
      count,
      volume,
      date,
      expires_at: dateExpire,
      platform_id: platformId
    })
      .then(([address]) => {
        console.log(JSON.stringify(address.dataValues))
      })
      .catch(err => {
        console.error('Error inserting address stats', err.message)
      })
  }

  upsertCoinHolders(address, balance, platformId) {
    CoinHolder.upsert({
      address,
      balance,
      platform_id: platformId
    })
      .then(([holders]) => {
        console.log(JSON.stringify(holders.dataValues))
      })
      .catch(err => {
        console.error('Error inserting coin holders', err.message)
      })
  }

  upsertAddressRanks(address, volume, platformId) {
    AddressRank.upsert({
      address,
      volume,
      platform_id: platformId
    })
      .then(([ranks]) => {
        console.log(JSON.stringify(ranks.dataValues))
      })
      .catch(err => {
        console.error('Error inserting address ranks', err.message)
      })
  }

}

module.exports = AddressSyncer
