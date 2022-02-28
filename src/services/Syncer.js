const { CronJob } = require('cron')
const { utcDate } = require('../utils')

class Syncer {

  cron(cronTime, onTick, start = true) {
    return new CronJob({
      timeZone: 'UTC',
      cronTime: this.cronTime(cronTime),
      onTick: () => onTick.call(this, this.syncParams(cronTime)),
      start
    })
  }

  cronTime(time) {
    switch (time) {
      case '10m':
        return '0 */10 * * * *'
      case '30m':
        return '0 */30 * * * *'
      case '1h':
        return '0 * * * *'
      case '4h':
        return '0 */4 * * *'
      case '1d':
        return '0 0 * * *'
      case '10d':
        return '0 0 */10 * *'
      default:
        return time
    }
  }

  syncParams(period) {
    switch (period) {
      case '1h':
        return {
          dateFrom: utcDate('yyyy-MM-dd HH:00:00Z', { hours: -1 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00Z'),
          dateExpiresIn: { hours: 24 }
        }
      case '4h':
        return {
          dateFrom: utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -4 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00Z', { days: -1 }),
          dateExpiresIn: { days: 7 }
        }
      case '1d':
        return {
          dateFrom: utcDate('yyyy-MM-dd', { days: -8 }),
          dateTo: utcDate('yyyy-MM-dd', { days: -7 })
        }
      default:
        return {}
    }
  }

  syncParamsHistorical(period) {
    switch (period) {
      case '1h':
        return {
          dateFrom: utcDate('yyyy-MM-dd HH:00:00Z', { hours: -24 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00Z'),
          dateExpiresIn: { hours: 24 }
        }
      case '4h':
        return {
          dateFrom: utcDate('yyyy-MM-dd 00:00:00Z', { days: -7 }),
          dateTo: utcDate('yyyy-MM-dd HH:00:00Z', { days: -1 }),
          dateExpiresIn: { days: 7 }
        }
      case '1d':
        return {
          dateFrom: utcDate('yyyy-MM-dd', { month: -12 }),
          dateTo: utcDate('yyyy-MM-dd', { days: -7 })
        }
      default:
        return {}
    }
  }
}

module.exports = Syncer
