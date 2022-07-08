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

  describe.only('#syncHistorical', () => {
    beforeEach(() => {
      sinon.stub(syncer, 'syncHistorical')
      sinon.stub(syncer, 'syncFromDune')
      sinon.stub(syncer, 'syncFromStreamingfast')
    })

    describe('when already liquidity exists', () => {
      it('returns without syncing', async () => {
        sinon.stub(DexLiquidity, 'exists').returns(true)
        await syncer.syncHistorical()
        sinon.assert.notCalled(syncer.syncFromDune)
        sinon.assert.notCalled(syncer.syncFromStreamingfast)
      })
    })

    describe('when no liquidity exists', () => {
      beforeEach(() => {
      })

      it.skip('fetches historical, weekly and daily stats in order', async () => {
        sinon.stub(DexLiquidity, 'exists').returns(false)
        await syncer.syncHistorical()

        // sinon.assert.calledOnce(syncer.syncFromDune)
        sinon.assert.calledOnce(syncer.syncFromStreamingfast).withArgs('2021-01-01T08:10:00Z')
      })
    })
  })

})
