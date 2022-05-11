const sinon = require('sinon')
const { DateTime } = require('luxon')

const DexLiquidity = require('../../src/db/models/DexLiquidity')
const DexLiquiditySyncer = require('../../src/services/DexLiquiditySyncer')

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
      sinon.stub(syncer, 'syncFromBigquery')
      sinon.stub(syncer, 'syncFromStreamingfast')
    })

    describe('when already liquidity exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(DexLiquidity, 'exists').returns(true)
        await syncer.syncHistorical()
        sinon.assert.notCalled(syncer.syncFromBigquery)
      })
    })

    describe('when no liquidity exists', () => {
      beforeEach(() => {
        sinon.stub(DexLiquidity, 'exists').returns(false)
      })

      it.skip('fetches historical, weekly and daily stats in order', async () => {
        await syncer.syncHistorical()

        sinon.assert.calledWith(syncer.syncStatsHistorical, {
          dateFrom: '2020-01-01',
          dateTo: '2020-12-02'
        })

        sinon.assert.calledThrice(syncer.syncFromBigquery)
        sinon.assert.calledOnce(syncer.syncFromStreamingfast)
        sinon.assert.callOrder(
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-02', dateTo: '2020-12-25' }),
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-25 00:00:00+0', dateTo: '2020-12-31 08:00:00+0' }),
          syncer.syncFromBigquery.withArgs({ dateFrom: '2020-12-31 08:00:00+0', dateTo: '2021-01-01 08:00:00+0' }),
        )
      })
    })
  })

})
