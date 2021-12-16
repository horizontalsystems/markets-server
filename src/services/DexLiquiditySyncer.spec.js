const sinon = require('sinon')
const { DateTime } = require('luxon')

const DexLiquidity = require('../db/models/DexLiquidity')
const DexLiquiditySyncer = require('./DexLiquiditySyncer')

describe('DexLiquiditySyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T08:10:00Z')

  /**
   * @type DexLiquiditySyncer
   */
  let syncer

  beforeEach(() => {
    sinon.useFakeTimers(date.ts)
    syncer = new DexLiquiditySyncer()
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
      sinon.stub(syncer, 'syncStatsHistorical')
      sinon.stub(syncer, 'syncStats')
    })

    describe('when already liquidity exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(DexLiquidity, 'exists').returns(true)
        await syncer.syncHistorical()
        sinon.assert.notCalled(syncer.syncStats)
      })
    })

    describe('when no liquidity exists', () => {
      beforeEach(() => {
        sinon.stub(DexLiquidity, 'exists').returns(false)
      })

      it('fetches historical, weekly and daily stats in order', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledWith(syncer.syncStatsHistorical, {
          dateFrom: '2020-01-01',
          dateTo: '2020-12-02'
        })

        sinon.assert.calledThrice(syncer.syncStats)
        sinon.assert.callOrder(
          syncer.syncStats.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }),
          syncer.syncStats.withArgs({ dateFrom: '2020-12-25 00:00:00+0', dateTo: '2020-12-31 08:00:00+0', dateExpiresIn: { days: 7 } }),
          syncer.syncStats.withArgs({ dateFrom: '2020-12-31 08:00:00+0', dateTo: '2021-01-01 08:00:00+0', dateExpiresIn: { hours: 24 } })
        )
      })
    })
  })

})
