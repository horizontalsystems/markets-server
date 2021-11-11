const sinon = require('sinon')
const { DateTime } = require('luxon')
const { expect } = require('chai')
const { utcDate } = require('../utils')

const Transaction = require('../db/models/Transaction')
const TransactionSyncer = require('./TransactionSyncer')

describe('TransactionSyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T08:10:00Z')
  const dateFormat = 'yyyy-MM-dd HH:mm:00Z'

  let syncer
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers(date.ts)
    syncer = new TransactionSyncer()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('#start', () => {
    it('syncs historical data before start', async () => {
      const syncHistorical = sinon.stub(syncer, 'syncHistorical')
      const syncLatest = sinon.stub(syncer, 'syncLatest')

      await syncer.start()
      sinon.assert.callOrder(syncHistorical, syncLatest)
    })
  })

  describe('#syncHistorical', () => {
    describe('when already transactions exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(Transaction, 'exists').returns(true)
        await syncer.syncHistorical()
      })
    })

    describe('when no transactions exists', () => {
      beforeEach(() => {
        sinon.stub(Transaction, 'exists').returns(false)

        this.syncMonthlyStats = sinon.stub(syncer, 'syncMonthlyStats')
        this.syncWeeklyStats = sinon.stub(syncer, 'syncWeeklyStats')
        this.syncDailyStats = sinon.stub(syncer, 'syncDailyStats')
      })

      it('fetches monthly, weekly and daily stats in order', async () => {
        await syncer.syncHistorical()

        sinon.assert.callOrder(
          this.syncMonthlyStats,
          this.syncWeeklyStats,
          this.syncDailyStats
        )
      })

      it('fetches monthly stats', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledWith(this.syncMonthlyStats, {
          dateFrom: '2020-12-02',
          dateTo: '2020-12-25'
        })
      })

      it('fetches weekly stats', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledWith(this.syncWeeklyStats, {
          dateFrom: '2020-12-25 00:00:00+0',
          dateTo: '2020-12-31 08:00:00+0',
          dateExpiresIn: { days: 7 }
        })
      })

      it('fetches daily stats', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledWith(this.syncDailyStats, {
          dateFrom: '2020-12-31 08:00:00+0',
          dateTo: '2021-01-01 08:00:00+0',
          dateExpiresIn: { hours: 24 }
        })
      })
    })
  })

  describe('#syncLatest', () => {
    it('fetches daily stats when 1 hour pass', () => {
      const syncDailyStats = sinon.stub(syncer, 'syncDailyStats')
      syncer.syncLatest()

      sinon.assert.notCalled(syncDailyStats)

      clock.tick(60 * 60 * 1000)

      expect(utcDate(dateFormat)).to.equal('2021-01-01 09:10:00+0')

      sinon.assert.calledWith(syncDailyStats, {
        dateFrom: '2021-01-01 08:00:00+0',
        dateTo: '2021-01-01 09:00:00+0',
        dateExpiresIn: { hours: 24 }
      })
    })

    it('fetches weekly stats when 4 hours pass', () => {
      const syncWeeklyStats = sinon.stub(syncer, 'syncWeeklyStats')
      syncer.syncLatest()

      sinon.assert.notCalled(syncWeeklyStats)
      expect(utcDate(dateFormat)).to.equal('2021-01-01 08:10:00+0')

      clock.tick(4 * 60 * 60 * 1000)

      expect(utcDate(dateFormat)).to.equal('2021-01-01 12:10:00+0')

      sinon.assert.calledWith(syncWeeklyStats, {
        dateFrom: '2020-12-31 08:00:00+0',
        dateTo: '2020-12-31 12:00:00+0',
        dateExpiresIn: { days: 7 }
      })
    })

    it('fetches monthly stats when 1 day pass', () => {
      const syncMonthlyStats = sinon.stub(syncer, 'syncMonthlyStats')
      syncer.syncLatest()

      sinon.assert.notCalled(syncMonthlyStats)
      expect(utcDate(dateFormat)).to.equal('2021-01-01 08:10:00+0')

      //          15 hours       50 minutes
      clock.tick((15 * 60 * 60 + 50 * 60) * 1000)
      sinon.assert.called(syncMonthlyStats)

      expect(utcDate(dateFormat)).to.equal('2021-01-02 00:00:00+0')

      sinon.assert.calledWith(syncMonthlyStats, {
        dateFrom: '2020-12-25',
        dateTo: '2020-12-26'
      })
    })
  })
})
