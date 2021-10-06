const EventEmitter = require('events')
const { DateTime } = require('luxon')
const { CronJob } = require('cron')

class SyncScheduler extends EventEmitter {

  constructor() {
    super()

    this.cronHourly = new CronJob({
      cronTime: '0 * * * *', // every hour
      onTick: this.onTick1Hour.bind(this),
      start: false
    })

    this.cron4Hourly = new CronJob({
      cronTime: '0 */4 * * *', // every 4 hours
      onTick: this.onTick4Hour.bind(this),
      start: false
    })

    this.cronDaily = new CronJob({
      cronTime: '0 0 * * *', // every day
      onTick: this.onTick1Day.bind(this),
      start: false
    })
  }

  start() {
    this.cronHourly.start()
    this.cron4Hourly.start()
    this.cronDaily.start()
  }

  onTick1Hour() {
    const dateExpiresIn = { hours: 24 }
    const dateFrom = DateTime.utc()
      .minus({ hours: 1 })
      .toFormat('yyyy-MM-dd HH:00:00')

    const dateTo = DateTime.utc()
      .toFormat('yyyy-MM-dd HH:00:00')

    this.emit('on-tick-1hour', {
      dateFrom,
      dateTo,
      dateExpiresIn
    })
  }

  onTick4Hour() {
    const dateExpiresIn = { days: 7 }
    const dateTo = DateTime.utc()
      .minus({ days: 1 }) /* -1 day because it's data synced by daily syncer */

    const dateFrom = dateTo
      .minus({ hours: 4 })

    this.emit('on-tick-4hour', {
      dateFrom,
      dateTo,
      dateExpiresIn
    })
  }

  onTick1Day() {
    const dateExpiresIn = { days: 30 }
    const dateTo = DateTime.utc()
      .minus({ days: 7 }) /* -7 day because it's data synced by weekly syncer */

    const dateFrom = dateTo
      .minus({ days: 1 })

    this.emit('on-tick-1day', {
      dateFrom,
      dateTo,
      dateExpiresIn
    })
  }

}

module.exports = SyncScheduler
