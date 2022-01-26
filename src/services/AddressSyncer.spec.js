const sinon = require('sinon')
const AddressSyncer = require('./AddressSyncer')

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
      const syncWeeklyStatsSpy = sinon.spy(syncer, 'syncWeeklyStats')
      const syncMonthlyStatsSpy = sinon.spy(syncer, 'syncMonthlyStats')
      const syncCoinHoldersSpy = sinon.spy(syncer, 'syncCoinHolders')

      syncer.syncLatest()

      sinon.assert.calledWith(cronStub, '1h', syncDailyStatsSpy)
      sinon.assert.calledWith(cronStub, '4h', syncWeeklyStatsSpy)
      sinon.assert.calledWith(cronStub, '1d', syncMonthlyStatsSpy)
      sinon.assert.calledWith(cronStub, '10d', syncCoinHoldersSpy)
    })
  })
})
