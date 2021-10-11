const { CronJob } = require('cron')
const { utcDate } = require('../utils')

class Syncer {

  cron(cronTime, onTick, start = true) {
    return new CronJob({
      timeZone: 'UTC',
      cronTime: this.cronTime(cronTime),
      onTick: () => onTick(this.syncParams(cronTime)),
      start
    })
  }

  cronTime(time) {
    switch (time) {
      case '1h':
        return '0 * * * *' // every hour
      case '4h':
        return '0 */4 * * *' // every 4 hours
      case '1d':
        return '0 0 * * *' // every day
      default:
        return time
    }
  }

  syncParams(period) {
    switch (period) {
      case '1h':
        return {
          dateFrom: utcDate('yyyy-MM-dd HH:00:00', { hours: -1 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00'),
          dateExpiresIn: { hours: 24 }
        }
      case '4h':
        return {
          dateFrom: utcDate('yyyy-MM-dd HH:00:00', { days: -1, hours: -4 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00', { days: -1 }),
          dateExpiresIn: { days: 7 }
        }
      case '1d':
        return {
          dateFrom: utcDate('yyyy-MM-dd', { days: -8 }),
          dateTo: utcDate('yyyy-MM-dd', { days: -7 })
        }
      default:
        throw Error('Invalid sync period')
    }
  }

  syncParamsHistorical(period) {
    switch (period) {
      case '1h':
        return {
          dateFrom: utcDate('yyyy-MM-dd HH:00:00', { hours: -24 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00'),
          dateExpiresIn: { hours: 24 }
        }
      case '4h':
        return {
          dateFrom: utcDate('yyyy-MM-dd 00:00:00', { days: -7 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00', { days: -1 }),
          dateExpiresIn: { days: 7 }
        }
      case '1d':
        return {
          dateFrom: utcDate('yyyy-MM-dd', { days: -30 }),
          dateTo: utcDate('yyyy-MM-dd', { days: -7 })
        }
      default:
        throw Error('Invalid sync period')
    }
  }
}

module.exports = Syncer
