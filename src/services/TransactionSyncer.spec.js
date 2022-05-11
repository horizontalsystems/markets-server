const sinon = require('sinon')
const { DateTime } = require('luxon')
const { expect } = require('chai')
const { utcDate } = require('../utils')
const { bitquery } = require('../providers/bitquery')
const Transaction = require('../db/models/Transaction')
const TransactionSyncer = require('./TransactionSyncer')
const Platform = require('../db/models/Platform')

describe('TransactionSyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T08:10:00Z')
  const dateFormat = 'yyyy-MM-dd HH:mm:00Z'

  /**
   * @type TransactionSyncer
   */
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
    beforeEach(() => {
      sinon.stub(syncer, 'syncFromBigquery')
      sinon.stub(syncer, 'syncFromBitquery')
    })

    describe('when already transactions exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(Transaction, 'existsForPlatforms').returns(true)
        await syncer.syncHistorical()
        sinon.assert.notCalled(syncer.syncFromBigquery)
      })
    })

    describe('when no transactions exists', () => {
      beforeEach(() => {
        sinon.stub(Transaction, 'exists').returns(false)
      })

      it.skip('fetches monthly, weekly and daily stats in order', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledThrice(syncer.syncFromBigquery)
        sinon.assert.callOrder(
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }),
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-25 00:00:00+0', dateTo: '2020-12-31 08:00:00+0' }),
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-31 08:00:00+0', dateTo: '2021-01-01 08:00:00+0' })
        )

        sinon.assert.calledTwice(syncer.syncFromBitquery)
        sinon.assert.callOrder(
          syncer.syncFromBitquery.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }, 'bsc'),
          syncer.syncFromBitquery.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }, 'solana')
        )
      })
    })
  })

  describe('#syncLatest', () => {

    beforeEach(() => {
      sinon.stub(syncer, 'syncDailyStats')
      sinon.stub(syncer, 'syncMonthlyStats')
    })

    it('fetches daily stats when 1 hour pass', () => {
      syncer.syncLatest()

      sinon.assert.notCalled(syncer.syncDailyStats)

      clock.tick(60 * 60 * 1000)

      expect(utcDate({}, dateFormat)).to.equal('2021-01-01 09:10:00+0')

      sinon.assert.calledWith(syncer.syncDailyStats, {
        dateFrom: '2021-01-01 08:30:00+0',
        dateTo: '2021-01-01 09:00:00+0'
      })
    })

    it('clears monthly stats when 1 day pass', () => {
      syncer.syncLatest()

      sinon.assert.notCalled(syncer.syncMonthlyStats)
      expect(utcDate({}, dateFormat)).to.equal('2021-01-01 08:10:00+0')

      //          15 hours       50 minutes
      clock.tick((15 * 60 * 60 + 50 * 60) * 1000)
      sinon.assert.called(syncer.syncMonthlyStats)

      expect(utcDate({}, dateFormat)).to.equal('2021-01-02 00:00:00+0')

      sinon.assert.calledWith(syncer.syncMonthlyStats, {
        dateFrom: '2020-12-02',
        dateTo: '2020-12-03'
      })
    })
  })

  describe('#syncFromBitquery', () => {
    const dataParams = {
      dateFrom: '2021-12-17 00:00:00+0',
      dateTo: '2021-12-17 01:00:00+0'
    }
    const platforms = [
      { id: 1, address: 'abc', type: 'bep20' }
    ]

    const transfers = [
      { count: 20, amount: 150, currency: { address: 'abc' }, date: { startOfInterval: '2021-12-17' } }
    ]

    const transactions = [
      { count: 10, volume: 100, platform_id: 1, date: '2021-12-17 00:00:00+0' }
    ]

    beforeEach(() => {
      sinon.stub(Platform, 'getByTypes').returns(platforms)
      sinon.stub(bitquery, 'getTransfers').returns(transfers)
      sinon.stub(Transaction, 'getSummedItems').returns(transactions)
      sinon.stub(Transaction, 'bulkCreate')
    })

    it('aggregates amount & amount', () => {
      syncer.syncFromBitquery(dataParams, 'bsc')
    })
  })
})
