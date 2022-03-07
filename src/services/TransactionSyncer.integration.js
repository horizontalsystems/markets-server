const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')

const Transaction = require('../db/models/Transaction')
const TransactionSyncer = require('./TransactionSyncer')
const bigquery = require('../providers/bigquery')
const bitquery = require('../providers/bitquery')
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
  const usdcBep20 = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'

  let clock
  beforeEach(async () => {
    clock = sinon.useFakeTimers(date.ts)
    await Coin.bulkCreate(coins)
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await factory.truncate(Transaction, Coin, Platform)
  })

  describe('#syncHistorical', () => {
    let param1d
    let param30m

    beforeEach(() => {
      sinon.stub(bigquery, 'getTransactionsStats').returns([])
      sinon.stub(bitquery, 'getTransfers').returns([])

      param1d = syncer.syncParamsHistorical('1d')
      param30m = syncer.syncParamsHistorical('30m')
    })

    describe('Ethereum and ERC20 tokens', () => {
      beforeEach(async () => {
        await Platform.bulkCreate([
          { id: 1, type: 'ethereum', decimals: 18, coin_id: 1 },
          { id: 2, type: 'erc20', decimals: 18, coin_id: 2, address: usdcErc20 }
        ])

        bigquery.getTransactionsStats
          .withArgs(param1d.dateFrom, param1d.dateTo, [{ address: usdcErc20, decimals: 18 }], '1d')
          .returns([
            { count: 10, volume: 100, address: usdcErc20, date: { value: param1d.dateFrom } }
          ])

        bigquery.getTransactionsStats
          .withArgs(param30m.dateFrom, param30m.dateTo, [{ address: usdcErc20, decimals: 18 }], '30m')
          .returns([
            { count: 10, volume: 100, address: usdcErc20, date: { value: param30m.dateFrom } }
          ])
      })

      it('syncs transactions stats', async () => {
        expect(await Transaction.count()).to.equal(0)
        await syncer.syncHistorical()
        expect(await Transaction.count()).to.equal(2)
      })
    })

    describe('BSC BEP20 tokens', () => {
      beforeEach(async () => {
        await Platform.bulkCreate([
          { id: 3, type: 'bep20', decimals: 18, coin_id: 2, address: usdcBep20 },
        ])

        bitquery.getTransfers
          .withArgs(param1d.dateFrom.slice(0, 10), [{ address: usdcBep20 }], 'bsc')
          .returns([
            { count: 50, amount: 500, currency: { address: usdcBep20 }, date: { startOfInterval: param30m.dateFrom } }
          ])
      })

      it('syncs transfers stats', async () => {
        expect(await Transaction.count()).to.equal(0)
        await syncer.syncHistorical()
        expect(await Transaction.count()).to.equal(1)
      })
    })
  })

  describe('#syncDailyStats', () => {
    let param30m

    beforeEach(async () => {
      sinon.stub(bigquery, 'getTransactionsStats').returns([])
      sinon.stub(bitquery, 'getTransfers').returns([])

      param30m = syncer.syncParams('30m')

      await Platform.bulkCreate([
        { id: 3, type: 'bep20', decimals: 18, coin_id: 2, address: usdcBep20 },
      ])

      bitquery.getTransfers
        .withArgs(param30m.dateFrom.slice(0, 10), [{ address: usdcBep20 }], 'bsc')
        .returns([
          { count: 60, amount: 600, currency: { address: usdcBep20 }, date: { startOfInterval: param30m.dateFrom } }
        ])
    })

    describe('adjusts volumes', () => {
      const transactions = [
        { count: 10, volume: 100, date: '2020-12-31 00:00:00+0', platform_id: 3 },
        { count: 10, volume: 100, date: '2020-12-31 01:00:00+0', platform_id: 3 },
        { count: 10, volume: 100, date: '2020-12-31 02:00:00+0', platform_id: 3 },
        { count: 10, volume: 100, date: '2020-12-31 03:00:00+0', platform_id: 3 },
        { count: 10, volume: 100, date: '2020-12-31 04:00:00+0', platform_id: 3 },
      ]

      beforeEach(async () => {
        await Transaction.bulkCreate(transactions)
      })

      it('calculates hourly volume', async () => {
        expect(await Transaction.count()).to.equal(5)
        await syncer.syncDailyStats(param30m)
        const txs = await Transaction.findAll()
        expect(txs).to.have.length(6)
        expect(txs[5].dataValues).to.deep.equal({
          id: 6,
          count: 10,
          volume: '100',
          date: new Date(param30m.dateFrom),
          platform_id: 3
        })
      })
    })
  })

})
