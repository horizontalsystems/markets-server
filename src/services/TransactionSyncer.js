const { DateTime } = require('luxon')
const Transaction = require('../db/models/Transaction')
const Platform = require('../db/models/Platform')
const SyncScheduler = require('./SyncScheduler')
const bigquery = require('../db/bigquery')

class TransactionSyncer extends SyncScheduler {

  constructor() {
    super()

    this.on('on-tick-1hour', params => this.sync1HourlyStats(params))
    this.on('on-tick-4hour', params => this.sync4HourlyStats(params))
    this.on('on-tick-1day', params => this.syncDailyStats(params))
  }

  async sync1HourlyStats(params) {
    await this.syncStats(
      params.dateFrom,
      params.dateTo,
      params.dateExpiresIn,
      '1h'
    )
    await this.deleteExpired()
  }

  async sync4HourlyStats(params) {
    await this.syncStats(
      params.dateFrom,
      params.dateTo,
      params.dateExpiresIn,
      '1h'
    )
  }

  async syncDailyStats(params) {
    await this.syncStats(
      params.dateFrom,
      params.dateTo,
      params.dateExpiresIn,
      '1h'
    )
  }

  async deleteExpired() {
    await Transaction.deleteExpired()
  }

  async syncStats(dateFrom, dateTo, dateExpiresIn, dateWindow) {
    const platforms = await this.getPlatforms()
    const transactions = await bigquery.getTransactionsStats(dateFrom, dateTo, platforms.tokens, dateWindow)

    transactions.forEach(transfer => {
      return this.upsertTransaction(
        transfer.count,
        transfer.volume,
        transfer.date.value,
        platforms.tokensMap[transfer.address],
        dateExpiresIn
      )
    })
  }

  upsertTransaction(count, volume, date, platformId, expireDuration) {
    const dateExpire = DateTime.fromISO(date)
      .plus(expireDuration)

    Transaction.upsert({
      count,
      volume,
      date,
      expires_at: dateExpire,
      platform_id: platformId
    })
      .then(([transaction]) => {
        console.log(JSON.stringify(transaction.dataValues))
      })
      .catch(err => {
        console.error('Error inserting transaction', err.message)
      })
  }

  async getPlatforms() {
    const tokens = []
    const tokensMap = {}

    const platforms = await Platform.findEthErc20()

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

}

module.exports = TransactionSyncer
