const sinon = require('sinon')
const { DateTime } = require('luxon')
const { expect } = require('chai')

const Address = require('../db/models/Address')
const AddressSyncer = require('./AddressSyncer')

describe('AddressSyncer', async () => {
  const date = DateTime.fromISO('2021-10-20T00:00:00Z')

  let syncer
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers(date.ts)
    syncer = new AddressSyncer()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('#syncLatest', () => {
    it('fetches daily stats when 1 hour pass', () => {
      const syncDailyStats = sinon.stub(syncer, 'syncDailyStats')
      syncer.syncLatest()
      clock.tick(60 * 60 * 1000)

      sinon.assert.calledWith(syncDailyStats, {
        dateFrom: '2021-10-20 00:00:00',
        dateTo: '2021-10-20 01:00:00',
        dateExpiresIn: { hours: 24 }
      })
    })

    it('updates points and removes expired, when ticks 4 hours', async () => {
      let addressesStats = [
        { id: 195, count: 1, date: '2021-10-19 05:00:00' },
        // ------------------------------------------------------> Items to be summed
        { id: 194, count: 1, date: '2021-10-19 04:00:00' }, // --> Item to be updated
        { id: 193, count: 1, date: '2021-10-19 03:00:00' },
        { id: 192, count: 1, date: '2021-10-19 02:00:00' },
        { id: 191, count: 1, date: '2021-10-19 01:00:00' },
        // ------------------------------------------------------->
        { id: 190, count: 4, date: '2021-10-19 00:00:00' },
      ]

      const syncWeeklyStats = sinon.spy(syncer, 'syncWeeklyStats')
      const adjustPoints = sinon.spy(syncer, 'adjustPoints')
      // ----------- sum the values and update last point ----------------------------
      const addressUpdatePoints = sinon.stub(Address, 'updatePoints').callsFake((dateFromStr, dateToStr) => {
        const dateFrom = DateTime.fromSQL(dateFromStr)
        const dateTo = DateTime.fromSQL(dateToStr)
        const filteredItems = addressesStats.filter(
          item => DateTime.fromSQL(item.date) > dateFrom && DateTime.fromSQL(item.date) <= dateTo
        )

        if (filteredItems) {
          const countSum = filteredItems.map(item => item.count).reduce((prev, next) => prev + next);
          const itemToUpdate = filteredItems.find(item => item.date === dateToStr)
          itemToUpdate.count = countSum
        }
      })

      // ------------ remove points between from and to dates -----------------
      const addressDeleteExpired = sinon.stub(Address, 'deleteExpired').callsFake((dateFromStr, dateToStr) => {
        const dateFrom = DateTime.fromSQL(dateFromStr)
        const dateTo = DateTime.fromSQL(dateToStr)
        const itemsToRemove = addressesStats.filter(
          item => DateTime.fromSQL(item.date) > dateFrom && DateTime.fromSQL(item.date) < dateTo
        )
        addressesStats = addressesStats.filter(item => !itemsToRemove.includes(item))
      })
      // ------------------------------------------------------------------------

      syncer.syncLatest()

      clock.tick(4 * 60 * 60 * 1000)
      await adjustPoints

      sinon.assert.calledWith(syncWeeklyStats, {
        dateFrom: '2021-10-19 00:00:00',
        dateTo: '2021-10-19 04:00:00',
        dateExpiresIn: { days: 7 }
      })

      sinon.assert.calledWith(addressUpdatePoints, '2021-10-19 00:00:00', '2021-10-19 04:00:00')
      sinon.assert.calledWith(addressDeleteExpired, '2021-10-19 00:00:00', '2021-10-19 04:00:00')

      expect(addressesStats.find(item => item.id === 194).count).to.equal(4)
      expect(addressesStats.length).to.equal(3)
    })

    it('updates points and removes expired, when ticks 1 day', () => {
      const syncMonthlyStats = sinon.stub(syncer, 'syncMonthlyStats')
      syncer.syncLatest()

      // 24 hours
      clock.tick(24 * 60 * 60 * 1000)

      sinon.assert.calledWith(syncMonthlyStats, {
        dateFrom: '2021-10-13',
        dateTo: '2021-10-14'
      })
    })
  })
})
