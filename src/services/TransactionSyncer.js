const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const { CronJob } = require('cron')
const Transaction = require('../db/models/Transaction')
const bigquery = require('../db/bigquery')
const Platform = require('../db/models/Platform')

class TransactionSyncer {

  constructor() {
    this.dailyCronJob = new CronJob({
      cronTime: '0 * * * *', // every hour
      onTick: this.onTickHour.bind(this),
      start: false
    })

    this.weeklyCronJob = new CronJob({
      cronTime: '0 */4 * * *', // every 4 hours
      onTick: this.syncWeekly.bind(this),
      start: false
    })

    this.monthlyCronJob = new CronJob({
      cronTime: '0 0 * * *', // every day
      onTick: this.syncMonthly.bind(this),
      start: false
    })
  }

  async onTickHour() {
    try {
      await this.syncDaily()
      await this.clearExpired()
    } catch (e) {
      console.error(e)
    }
  }

  async start() {
    this.dailyCronJob.start()
    this.weeklyCronJob.start()
    this.monthlyCronJob.start()
  }

  async syncDaily() {
    const dateExpiresIn = { hours: 24 }
    const dateFrom = DateTime.utc()
      .minus({ hours: 1 })
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncStats(dateFrom, dateExpiresIn, '1h')
  }

  async syncWeekly() {
    const dateExpiresIn = { days: 7 }
    const dateFrom = DateTime.utc()
      .minus({ days: 1 }) /* -1 day because it's data synced by daily syncer */
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncStats(dateFrom, dateExpiresIn, '4h')
  }

  async syncMonthly() {
    const dateExpiresIn = { days: 30 }
    const dateFrom = DateTime.utc()
      .minus({ days: 7 }) /* -7 day because it's data synced by weekly syncer */
      .toFormat('yyyy-MM-dd')

    await this.syncStats(dateFrom, dateExpiresIn, '1d')
  }

  async clearExpired() {
    await Transaction.deleteExpired()
  }

  async syncStats(dateFrom, dateExpiresIn, dateWindow) {
    const platforms = await this.getPlatforms()
    const tokenTransfers = await bigquery.getTokenTransfers(dateFrom, platforms.tokens, dateWindow)
    const etherTransactions = await bigquery.getEtherTransactions(dateFrom, dateWindow)

    tokenTransfers.forEach(transfer => {
      return this.upsertTransaction(
        transfer.count,
        transfer.volume,
        transfer.date.value,
        platforms.tokensMap[transfer.address],
        dateExpiresIn
      )
    })

    etherTransactions.forEach(transaction => this.upsertTransaction(
      transaction.count,
      transaction.volume,
      transaction.date.value,
      platforms.tokensMap.ethereum,
      dateExpiresIn
    ))
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
