const sinon = require('sinon')
const CurrencyRateSyncer = require('../../src/services/CurrencyRateSyncer')

describe('CurrencyRateSyncer', async () => {

  /** @type CurrencyRateSyncer */
  let syncer

  beforeEach(() => {
    syncer = new CurrencyRateSyncer()
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
})
