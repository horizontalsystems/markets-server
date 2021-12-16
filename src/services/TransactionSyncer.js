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

    await this.syncStats(this.syncParamsHistorical('1d'), '1d')
    await this.syncStats(this.syncParamsHistorical('4h'), '4h')
    await this.syncStats(this.syncParamsHistorical('1h'), '1h')
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncStats(dateParams, '1h')
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Transaction.updatePoints(dateFrom, dateTo)
    await Transaction.deleteExpired(dateFrom, dateTo)
  }

  async syncStats({ dateFrom, dateTo }, datePeriod) {
    const platforms = await this.getPlatforms()
    const transactions = await bigquery.getTransactionsStats(dateFrom, dateTo, platforms.tokens, datePeriod)

    const records = transactions
      .map(transaction => ({
        count: transaction.count,
        volume: transaction.volume,
        date: transaction.date.value,
        platform_id: platforms.tokensMap[transaction.address]
      }))
      .filter(item => item.platform_id)

    if (!records.length) {
      return
    }

    return Transaction.bulkCreate(records, { ignoreDuplicates: true })
      .catch(e => {
        console.error('Error inserting transactions', e.message)
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
