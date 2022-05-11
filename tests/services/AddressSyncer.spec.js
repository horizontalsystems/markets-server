const sinon = require('sinon')
const AddressSyncer = require('../../src/services/AddressSyncer')

describe('AddressSyncer', async () => {

  /** @type AddressSyncer */
  let syncer

  beforeEach(() => {
    syncer = new AddressSyncer()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('#syncLatest', () => {

    it('registers cron tasks', () => {
      const cronStub = sinon.stub(syncer, 'cron')
      const syncDailyStatsSpy = sinon.spy(syncer, 'syncDailyStats')
      const syncMonthlyStatsSpy = sinon.spy(syncer, 'syncMonthlyStats')

      syncer.syncLatest()

      sinon.assert.calledWith(cronStub, '30m', syncDailyStatsSpy)
      sinon.assert.calledWith(cronStub, '1d', syncMonthlyStatsSpy)
    })
  })
})
