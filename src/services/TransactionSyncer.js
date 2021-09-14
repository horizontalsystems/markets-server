const { CronJob } = require('cron')
const Transaction = require('../db/models/Transaction')
const bigquery = require('../db/bigquery')

class TransactionSyncer {

  initialSyncDate = '2021-09-01'
  cronJob = new CronJob({
    cronTime: '*/30 * * * *', // every 30 mins
    onTick: this.sync.bind(this),
    start: false
  })

  async start() {
    const lastSyncDate = await this.getLastSyncDate()

    // This fetch is unnecessary for the app restart
    if (!this.isSameDay(lastSyncDate)) {
      await this.fetchAndSave(lastSyncDate)
    }

    // Schedule cron task
    this.cronJob.start()
  }

  async sync() {
    const lastSyncDate = await this.getLastSyncDate()
    await this.fetchAndSave(lastSyncDate)
  }

  async fetchAndSave(fromDate) {
    const transactions = await bigquery.getTransactions(fromDate)

    await Transaction.bulkCreate(transactions, {
      updateOnDuplicate: ['count', 'volume']
    })
  }

  async getLastSyncDate() {
    const transaction = await Transaction.getLast()
    return transaction ? transaction.date : new Date(this.initialSyncDate)
  }

  isSameDay(date) {
    const today = new Date()
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getDate() === date.getDate() &&
      today.getMonth() === date.getMonth()
    )
  }

}

module.exports = TransactionSyncer
