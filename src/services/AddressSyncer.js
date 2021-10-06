const { Op } = require('sequelize')
const { CronJob } = require('cron')
const { DateTime } = require('luxon')
const bigquery = require('../db/bigquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const CoinHolder = require('../db/models/CoinHolder')
const AddressRank = require('../db/models/AddressRank')

class AddressSyncer {

  constructor() {
    this.ADDRESSES_PER_COIN = 20
    this.ADDRESS_RANK_PERIOD = 3

    this.hourlyCronJob = new CronJob({
      cronTime: '0 * * * *', // every hour
      onTick: this.syncHourly.bind(this),
      start: false
    })

    this.fourHourCronJob = new CronJob({
      cronTime: '0 */4 * * *', // every 4 hours
      onTick: this.syncFourHour.bind(this),
      start: false
    })

    this.dailyCronJob = new CronJob({
      cronTime: '0 0 * * *', // every day
      onTick: this.syncDaily.bind(this),
      start: false
    })
  }

  async start() {
    this.hourlyCronJob.start()
    this.fourHourCronJob.start()
    this.dailyCronJob.start()
  }

  async syncHourly() {
    try {
      await this.syncHourlyStats()
    } catch (e) {
      console.error(e)
    }
  }

  async syncFourHour() {
    try {
      await this.syncWeeklyStats()
      await this.syncCoinHolders()
      await this.syncAddressRanks()
    } catch (e) {
      console.error(e)
    }
  }

  async syncDaily() {
    try {
      await this.syncMonthlyStats()
    } catch (e) {
      console.error(e)
    }
  }

  async clearExpired() {
    await Address.deleteExpired()
  }

  async syncHourlyStats() {
    const dateExpiresIn = { hours: 24 }
    const dateFrom = DateTime.utc()
      .minus({ hours: 1 })
      .toFormat('yyyy-MM-dd HH:00:00')
    const dateTo = DateTime.utc()
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncStats(dateFrom, dateTo, dateExpiresIn, '1h')
    await this.clearExpired()
  }

  async syncWeeklyStats() {
    const dateExpiresIn = { days: 7 }
    const dateFrom = DateTime.utc()
      .minus({ days: 1 }) /* -1 day because it's data synced by daily syncer */
      .toFormat('yyyy-MM-dd HH:00:00')
    const dateTo = DateTime.utc()
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncStats(dateFrom, dateTo, dateExpiresIn, '4h')
  }

  async syncMonthlyStats() {
    const dateExpiresIn = { days: 30 }
    const dateFrom = DateTime.utc()
      .minus({ days: 7 }) /* -7 day because it's data synced by weekly syncer */
      .toFormat('yyyy-MM-dd')
    const dateTo = DateTime.utc()
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncStats(dateFrom, dateTo, dateExpiresIn, '1d')
  }

  async syncStats(dateFrom, dateTo, dateExpiresIn, timePeriod) {
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

    // ----------Remove all ----------
    await CoinHolder.deleteAll()
    // -------------------------------
    const dateFrom = DateTime.utc()
      .minus({ month: this.ADDRESS_RANK_PERIOD })
      .toFormat('yyyy-MM-dd')
    const platforms = await this.getPlatforms()
    const coinHolders = await bigquery.getTopCoinHolders(platforms.tokens, dateFrom, this.ADDRESSES_PER_COIN)

    coinHolders.forEach(data => {
      return this.upsertCoinHolders(
        data.address,
        data.balance,
        platforms.tokensMap[data.coin_address]
      )
    })
  }

  async syncAddressRanks() {

    // ----------Remove all ----------
    await AddressRank.deleteAll()
    // -------------------------------

    const dateFrom = DateTime.utc()
      .minus({ month: this.ADDRESS_RANK_PERIOD })
      .toFormat('yyyy-MM-dd')
    const platforms = await this.getPlatforms()
    const addressRanks = await bigquery.getTopAddresses(platforms.tokens, dateFrom, this.ADDRESSES_PER_COIN)

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
    const dateExpire = DateTime.fromISO(date)
      .plus(expireDuration)

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
