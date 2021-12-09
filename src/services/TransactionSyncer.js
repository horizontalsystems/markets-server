const { DateTime } = require('luxon')
const Transaction = require('../db/models/Transaction')
const Platform = require('../db/models/Platform')
const bigquery = require('../providers/bigquery')
const Syncer = require('./Syncer')

class TransactionSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await Transaction.exists()) {
      return
    }

    await this.syncMonthlyStats(this.syncParamsHistorical('1d'), '1d')
    await this.syncWeeklyStats(this.syncParamsHistorical('4h'), '4h')
    await this.syncDailyStats(this.syncParamsHistorical('1h'), '1h')
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncStats(dateParams, '1h')
  }

  async syncWeeklyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Transaction.updatePoints(dateFrom, dateTo)
    await Transaction.deleteExpired(dateFrom, dateTo)
  }

  async syncStats({ dateFrom, dateTo, dateExpiresIn }, datePeriod) {
    const platforms = await this.getPlatforms()
    const transactions = await bigquery.getTransactionsStats(dateFrom, dateTo, platforms.tokens, datePeriod)

    transactions.forEach(transaction => this.upsertTransaction(
      transaction.count,
      transaction.volume,
      transaction.date.value,
      platforms.tokensMap[transaction.address],
      dateExpiresIn
    ))
  }

  upsertTransaction(count, volume, date, platformId, expireDuration) {
    let expiresAt = null
    if (expireDuration) {
      expiresAt = DateTime.fromISO(date)
        .plus(expireDuration)
    }

    Transaction.upsert({
      count,
      volume,
      date,
      expires_at: expiresAt,
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
