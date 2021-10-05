const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const { CronJob } = require('cron')
const Transaction = require('../db/models/Transaction')
const bigquery = require('../db/bigquery')
const Platform = require('../db/models/Platform')

class TransactionSyncer {

  constructor() {
    this.hourlyCronJob = new CronJob({
      cronTime: '0 * * * *', // every hour
      onTick: this.onTickHour.bind(this),
      start: false
    })

    this.fourHourlyCronJob = new CronJob({
      cronTime: '0 */4 * * *', // every 4 hours
      onTick: this.syncFourHourly.bind(this),
      start: false
    })

    this.dailyCronJob = new CronJob({
      cronTime: '0 0 * * *', // every day
      onTick: this.syncDaily.bind(this),
      start: false
    })
  }

  async onTickHour() {
    try {
      await this.syncHourly()
      await this.clearExpired()
    } catch (e) {
      console.error(e)
    }
  }

  async start() {
    this.hourlyCronJob.start()
    this.fourHourlyCronJob.start()
    this.dailyCronJob.start()
  }

  async syncHourly() {
    const dateExpiresIn = { hours: 23 }
    const dateFrom = DateTime.utc()
      .minus({ hours: 1 })
      .toFormat('yyyy-MM-dd HH:00:00')

    const dateTo = DateTime.utc()
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncStats(dateFrom, dateTo, dateExpiresIn, '1h')
  }

  async syncFourHourly() {
    const dateExpiresIn = { days: 6 }
    const dateTo = DateTime.utc()
      .minus({ days: 1 }) /* -1 day because it's data synced by daily syncer */

    const dateFrom = dateTo
      .minus({ hours: 4 })

    await this.syncStats(
      dateFrom.toFormat('yyyy-MM-dd HH:00:00'),
      dateTo.toFormat('yyyy-MM-dd HH:00:00'),
      dateExpiresIn, '4h'
    )
  }

  async syncDaily() {
    const dateExpiresIn = { days: 30 }
    const dateTo = DateTime.utc()
      .minus({ days: 7 }) /* -7 day because it's data synced by weekly syncer */

    const dateFrom = dateTo
      .minus({ days: 1 })

    await this.syncStats(
      dateFrom.toFormat('yyyy-MM-dd'),
      dateTo.toFormat('yyyy-MM-dd'),
      dateExpiresIn,
      '1d'
    )
  }

  async clearExpired() {
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

}

module.exports = TransactionSyncer
