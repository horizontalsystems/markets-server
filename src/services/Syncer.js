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
      case '30m':
        return {
          dateFrom: utcDate({ minute: -30 }),
          dateTo: utcDate({})
        }
      case '1h':
        return {
          dateFrom: utcDate({ minute: -30 }),
          dateTo: utcDate()
        }
      case '1d':
        return {
          dateFrom: utcDate({ days: -31 }, 'yyyy-MM-dd'),
          dateTo: utcDate({ days: -30 }, 'yyyy-MM-dd')
        }
      default:
        return {}
    }
  }

  syncParamsHistorical(period) {
    switch (period) {
      case '30m':
        return {
          dateFrom: utcDate({ days: -30 }),
          dateTo: utcDate()
        }
      case '1d':
        return {
          dateFrom: utcDate({ month: -12 }, 'yyyy-MM-dd'),
          dateTo: utcDate({}, 'yyyy-MM-dd')
        }
      default:
        return {}
    }
  }
}

module.exports = Syncer
