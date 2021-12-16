const sinon = require('sinon')
const { expect } = require('chai')
const { random, sumBy, takeRight } = require('lodash')
const { DateTime } = require('luxon')

const Transaction = require('../db/models/Transaction')
const TransactionSyncer = require('./TransactionSyncer')
const bigquery = require('../providers/bigquery')
const Platform = require('../db/models/Platform')
const Coin = require('../db/models/Coin')

describe('TransactionSyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T00:00:00Z')
  const syncer = new TransactionSyncer()

  const coins = [
    { id: 1, uid: 'ethereum' },
    { id: 2, uid: 'usd-coin' },
  ]

  const usdcErc20 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const usdcBep20 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const platforms = [
    { id: 1, type: 'ethereum', decimals: 18, coin_id: 1 },
    { id: 2, type: 'erc20', decimals: 18, coin_id: 2, address: usdcErc20 },
    { id: 3, type: 'bep20', decimals: 18, coin_id: 2, address: usdcBep20 },
  ]

  let clock
  beforeEach(async () => {
    clock = sinon.useFakeTimers(date.ts)
    await Coin.bulkCreate(coins)
    await Platform.bulkCreate(platforms)
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await factory.truncate(Transaction, Coin, Platform)
  })

  describe('#syncHistorical', () => {
    let param1d
    let param4h
    let param1h

    beforeEach(() => {
      sinon.stub(bigquery, 'getTransactionsStats').returns([])

      param1d = syncer.syncParamsHistorical('1d')
      param4h = syncer.syncParamsHistorical('4h')
      param1h = syncer.syncParamsHistorical('1h')
    })

    describe('Ethereum and ERC-20 tokens', () => {
      beforeEach(async () => {
        bigquery.getTransactionsStats
          .withArgs(param1d.dateFrom, param1d.dateTo, [{ address: usdcErc20, decimals: 18 }], '1d')
          .returns([
            { count: 10, volume: 100, address: usdcErc20, date: { value: param1d.dateTo } }
          ])

        bigquery.getTransactionsStats
          .withArgs(param4h.dateFrom, param4h.dateTo, [{ address: usdcErc20, decimals: 18 }], '4h')
          .returns([
            { count: 10, volume: 100, address: usdcErc20, date: { value: param4h.dateTo } }
          ])

        bigquery.getTransactionsStats
          .withArgs(param1h.dateFrom, param1h.dateTo, [{ address: usdcErc20, decimals: 18 }], '1h')
          .returns([
            { count: 10, volume: 100, address: usdcErc20, date: { value: param1h.dateTo } }
          ])
      })

      it('syncs historical transactions stats', async () => {
        expect(await Transaction.count()).to.equal(0)
        await syncer.syncHistorical()
        expect(await Transaction.count()).to.equal(3)
      })
    })
  })

  describe('#syncWeeklyStats', () => {
    const mapper = ([timestamp, volume]) => ({
      volume,
      count: random(10, 50),
      date: new Date(timestamp * 1000),
      address: usdcErc20,
      platform_id: 2
    })

    let params
    let transactions

    beforeEach(async () => {
      params = syncer.syncParams('4h')
      transactions = factory.data(28, mapper, 'hour')

      await Transaction.bulkCreate(transactions)
    })

    it('adjusts posts', async () => {
      expect(await Transaction.count()).to.equal(28)
      await syncer.syncWeeklyStats(params)
      expect(await Transaction.count()).to.equal(25)

      const lastTxs = takeRight(transactions, 4)
      const hourHourTx = await Transaction.query('SELECT * FROM transactions WHERE date > :dateFrom AND date <= :dateTo', {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })

      expect(hourHourTx).to.have.length(1)
      expect(hourHourTx[0]).to.deep.equal({
        id: 25,
        count: sumBy(lastTxs, 'count'),
        volume: sumBy(lastTxs, 'volume').toString(),
        date: new Date(params.dateTo),
        platform_id: 2
      })
    })
  })
})
