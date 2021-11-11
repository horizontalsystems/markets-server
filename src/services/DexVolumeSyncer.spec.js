const sinon = require('sinon')
const { DateTime } = require('luxon')

const DexVolume = require('../db/models/DexVolume')
const DexVolumeSyncer = require('./DexVolumeSyncer')

describe('DexVolumeSyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T08:10:00Z')

  let syncer

  beforeEach(() => {
    sinon.useFakeTimers(date.ts)
    syncer = new DexVolumeSyncer()
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
    describe('when already DexVolume exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(DexVolume, 'exists').returns(true)
        await syncer.syncHistorical()
      })
    })

    describe('when no DexVolume exists', () => {
      beforeEach(() => {
        sinon.stub(DexVolume, 'exists').returns(false)

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

})
