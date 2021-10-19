const sinon = require('sinon')
const CurrencyPriceSyncer = require('./CurrencyPriceSyncer')

describe('CurrencyPriceSyncer', async () => {
  let syncer

  beforeEach(() => {
    syncer = new CurrencyPriceSyncer()
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
