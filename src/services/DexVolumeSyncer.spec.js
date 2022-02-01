const sinon = require('sinon')
const { DateTime } = require('luxon')

const DexVolume = require('../db/models/DexVolume')
const DexVolumeSyncer = require('./DexVolumeSyncer')

describe('DexVolumeSyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T08:10:00Z')
  const syncer = new DexVolumeSyncer()

  beforeEach(() => {
    sinon.useFakeTimers(date.ts)
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

    describe('when already DexVolume exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(DexVolume, 'exists').returns(true)
        await syncer.syncHistorical()
        sinon.assert.notCalled(syncer.syncFromBigquery)
      })
    })

    describe('when no DexVolume exists', () => {
      beforeEach(() => {
        sinon.stub(DexVolume, 'exists').returns(false)
      })

      it.skip('fetches monthly, weekly and daily stats in order', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledThrice(syncer.syncFromBigquery)
        sinon.assert.calledOnce(syncer.syncFromBitquery)
        sinon.assert.callOrder(
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }),
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-25 00:00:00+0', dateTo: '2020-12-31 08:00:00+0', dateExpiresIn: { days: 7 } }),
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-31 08:00:00+0', dateTo: '2021-01-01 08:00:00+0', dateExpiresIn: { hours: 24 } }),
          syncer.syncFromBitquery.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }, 'bsc', 'day')
        )
      })
    })
  })

})
