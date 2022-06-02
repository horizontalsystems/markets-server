const sinon = require('sinon')
const { DateTime } = require('luxon')
const CoinPriceSyncer = require('../../src/services/CoinPriceSyncer')
const CoinPrice = require('../../src/db/models/CoinPrice')

describe('CoinPriceSyncer', async () => {
  const syncer = new CoinPriceSyncer()
  let clock

  afterEach(() => {
    sinon.restore()
    clock.restore()
  })

  describe('#adjustHistoryGaps', () => {
    describe('30m', () => {
      beforeEach(() => {
        clock = sinon.useFakeTimers(DateTime.fromISO('2021-01-31T01:00:00Z').ts)
        sinon.stub(CoinPrice, 'deleteExpired')

        syncer.adjustHistoryGaps()
      })

      it('deletes expired data since 7d+30m', () => {
        sinon.assert.notCalled(CoinPrice.deleteExpired)
        clock.tick(30 * 60 * 1000)
        sinon.assert.calledWith(CoinPrice.deleteExpired, '2021-01-24 01:00:00+0', '2021-01-24 01:30:00+0')
      })
    })

    describe('4h', () => {
      beforeEach(() => {
        sinon.stub(CoinPrice, 'deleteExpired')
        clock = sinon.useFakeTimers(DateTime.fromISO('2021-01-31T03:30:00Z').ts)

        syncer.adjustHistoryGaps()
      })

      it('deletes expired data since 7d+30m', () => {
        sinon.assert.notCalled(CoinPrice.deleteExpired)
        clock.tick(30 * 60 * 1000)

        sinon.assert.calledTwice(CoinPrice.deleteExpired)
        sinon.assert.calledWith(CoinPrice.deleteExpired.firstCall, '2021-01-24 03:30:00+0', '2021-01-24 04:00:00+0')
        sinon.assert.calledWith(CoinPrice.deleteExpired.secondCall, '2021-01-01 00:00:00+0', '2021-01-01 04:00:00+0')
      })
    })

    describe('1d', () => {
      beforeEach(() => {
        sinon.stub(CoinPrice, 'deleteExpired')
        clock = sinon.useFakeTimers(DateTime.fromISO('2021-01-31T23:30:00Z').ts)

        syncer.adjustHistoryGaps()
      })

      it('deletes expired data since 7d+30m', () => {
        sinon.assert.notCalled(CoinPrice.deleteExpired)
        clock.tick(30 * 60 * 1000)

        sinon.assert.calledThrice(CoinPrice.deleteExpired)
        sinon.assert.calledWith(CoinPrice.deleteExpired.firstCall, '2021-01-24 23:30:00+0', '2021-01-25 00:00:00+0')
        sinon.assert.calledWith(CoinPrice.deleteExpired.secondCall, '2021-01-01 20:00:00+0', '2021-01-02 00:00:00+0')
        sinon.assert.calledWith(CoinPrice.deleteExpired.thirdCall, '2021-01-01', '2021-01-02')
      })
    })
  })

})
