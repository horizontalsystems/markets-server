const sinon = require('sinon')
const { DateTime } = require('luxon')
const { CronJob } = require('cron')
const { expect } = require('chai')
const { utcDate } = require('../utils')

const Syncer = require('./Syncer')

describe('Syncer', async () => {
  const date = DateTime.fromSQL('2021-01-01 00:10:00Z')
  const dateFormat = 'yyyy-MM-dd HH:mm:00Z'

  let syncer
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers(date.ts)
    syncer = new Syncer()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('#cron', () => {
    it('creates cron job', () => {
      const onTick = sinon.spy()
      const cron = syncer.cron('1h', onTick)
      expect(cron).instanceof(CronJob)
    })

    it('calls a given function at the specified time pass', () => {
      const onTick = sinon.spy()
      syncer.cron('1h', onTick)

      sinon.assert.notCalled(onTick)
      expect(utcDate(dateFormat)).to.equal('2021-01-01 00:10:00+0')
      clock.tick(60 * 60 * 1000)
      expect(utcDate(dateFormat)).to.equal('2021-01-01 01:10:00+0')

      sinon.assert.calledWith(onTick, {
        dateFrom: '2021-01-01 00:00:00+0',
        dateTo: '2021-01-01 01:00:00+0',
        dateExpiresIn: { hours: 24 }
      })
    })
  })

  describe('#cronTime', () => {
    it('converts time periods to cron time', () => {
      expect(syncer.cronTime('1h')).to.equal('0 * * * *')
      expect(syncer.cronTime('4h')).to.equal('0 */4 * * *')
      expect(syncer.cronTime('1d')).to.equal('0 0 * * *')
    })

    it('returns cron time regex as is', () => {
      expect(syncer.cronTime('* * * * *')).to.eq('* * * * *')
    })
  })

  describe('#syncParams', () => {
    it('returns date params for the `1h` period', () => {
      expect(syncer.syncParams('1h')).deep.equal({
        dateFrom: '2020-12-31 23:00:00+0',
        dateTo: '2021-01-01 00:00:00+0',
        dateExpiresIn: { hours: 24 }
      })
    })

    it('returns date params for the `4h` period', () => {
      expect(syncer.syncParams('4h')).deep.equal({
        dateFrom: '2020-12-30 20:00:00+0',
        dateTo: '2020-12-31 00:00:00+0',
        dateExpiresIn: { days: 7 }
      })
    })

    it('returns date params for the `1d` period', () => {
      expect(syncer.syncParams('1d')).deep.equal({
        dateFrom: '2020-12-24',
        dateTo: '2020-12-25'
      })
    })
  })

  describe('#syncParamsHistorical', () => {

    it('returns date params for the `1h` period', () => {
      expect(syncer.syncParamsHistorical('1h')).deep.equal({
        dateFrom: '2020-12-31 00:00:00+0',
        dateTo: '2021-01-01 00:00:00+0',
        dateExpiresIn: { hours: 24 }
      })
    })

    it('returns date params for the `4h` period', () => {
      expect(syncer.syncParamsHistorical('4h')).deep.equal({
        dateFrom: '2020-12-25 00:00:00+0',
        dateTo: '2020-12-31 00:00:00+0',
        dateExpiresIn: { days: 7 }
      })
    })

    it('returns date params for the `1d` period', () => {
      expect(syncer.syncParamsHistorical('1d')).deep.equal({
        dateFrom: '2020-12-02',
        dateTo: '2020-12-25'
      })
    })
  })

})
