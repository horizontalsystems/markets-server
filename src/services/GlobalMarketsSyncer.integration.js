const nock = require('nock')
const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')
const { utcDate } = require('../utils')

const GlobalMarketsSyncer = require('./GlobalMarketsSyncer')
const GlobalMarket = require('../db/models/GlobalMarket')

const defillama = 'https://api.llama.fi'
const coingecko = 'https://www.coingecko.com'
const coingeckoAPI = 'https://api.coingecko.com/api/v3'

describe('GlobalMarketsSyncer', () => {
  const now = DateTime.fromSQL('2021-01-01 00:00:00Z')

  /** @type GlobalMarketsSyncer */
  let syncer
  let clock

  beforeEach(async () => {
    clock = sinon.useFakeTimers(now.ts)
    syncer = new GlobalMarketsSyncer()
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await GlobalMarket.destroy({ truncate: true, cascade: true })
  })

  describe('#syncHistorical', () => {
    const protocols = [
      factory.defillamaProtocolFull('curve', ['Ethereum', 'Avalanche']),
      factory.defillamaProtocolFull('maker', ['Ethereum'])
    ]

    const mapper = ([date, totalLiquidityUSD]) => ({
      date: date / 1000,
      totalLiquidityUSD
    })

    beforeEach(() => {
      nock(coingecko).get('/market_cap/total_charts_data?vs_currency=usd').reply(200, {
        stats: factory.data(5),
        total_volumes: factory.data(5)
      })
      nock(coingecko).get('/global_charts/market_dominance_data?duration=60').reply(200, {
        series_data_array: [{
          name: 'BTC',
          data: factory.data(5)
        }]
      })
      nock(coingecko).get('/en/defi_market_cap_data?vs_currency=usd&duration=60').reply(200, [{
        name: 'DeFi',
        data: factory.data(5)
      }])

      nock(defillama).get('/protocols').reply(200, protocols)
      nock(defillama).get('/charts').reply(200, factory.data(5, mapper))
      nock(defillama).get('/charts/Ethereum').reply(200, factory.data(5, mapper))
      nock(defillama).get('/charts/Avalanche').reply(200, factory.data(5, mapper))
    })

    it('syncs historical markets data', async () => {
      expect(await GlobalMarket.findAll()).to.have.length(0)
      await syncer.syncHistorical()

      const globalMarkets = await GlobalMarket.findAll()
      expect(globalMarkets).to.have.length(5)
    })
  })

  describe('#syncDailyStats', () => {
    let syncParams

    const globalMarketData = {
      total_market_cap: { usd: 2769127.498 },
      total_volume: { usd: 17341164.6996 },
      market_cap_percentage: { btc: 41.43378 }
    }
    const defiMarketData = {
      defi_market_cap: 146296308.5566
    }

    beforeEach(() => {
      syncParams = syncer.syncParams('1h')

      nock(coingeckoAPI).get('/global').reply(200, { data: globalMarketData })
      nock(coingeckoAPI).get('/global/decentralized_finance_defi')
        .reply(200, { data: defiMarketData })
    })

    it('syncs latest market data', async () => {
      expect(await GlobalMarket.findAll()).to.have.length(0)
      await syncer.syncDailyStats(syncParams)
      expect(await GlobalMarket.findAll()).to.have.length(1)
    })

    describe('when there is a record with the same date', () => {
      const savedMarketData = {
        tvl: 1000.1,
        chain_tvls: {
          Ethereum: 1000.0
        }
      }

      beforeEach(async () => {
        await GlobalMarket.create({
          date: syncParams.dateTo,
          ...savedMarketData
        })
      })

      it('updates record', async () => {
        expect(await GlobalMarket.findAll()).to.have.length(1)
        await syncer.syncDailyStats(syncParams)

        const globalMarkets = await GlobalMarket.findAll()

        expect(globalMarkets).to.have.length(1)
        expect(globalMarkets[0].dataValues).to.deep.include({
          date: new Date(syncParams.dateTo),
          market_cap: String(globalMarketData.total_market_cap.usd),
          defi_market_cap: String(defiMarketData.defi_market_cap),
          volume: String(globalMarketData.total_volume.usd),
          btc_dominance: String(globalMarketData.market_cap_percentage.btc),
          tvl: String(savedMarketData.tvl),
          chain_tvls: savedMarketData.chain_tvls
        })
      })
    })
  })

  describe('#syncWeeklyStats', () => {
    let syncParams
    const dates = []

    beforeEach(async () => {
      syncParams = syncer.syncParams('4h')
      dates.push(
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -4 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -3 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -2 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -1 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -1 })
      )

      for (let i = 0; i < dates.length; i += 1) {
        const date = dates[i]
        await GlobalMarket.create({ date })
      }
    })

    it('deletes expired points', async () => {
      expect(await GlobalMarket.findAll()).to.have.length(5)
      await syncer.syncWeeklyStats(syncParams)

      const globalMarkets = await GlobalMarket.findAll()

      expect(globalMarkets).to.have.length(2)
      expect(globalMarkets[0].date).to.deep.equal(new Date(dates[0]))
      expect(globalMarkets[1].date).to.deep.equal(new Date(dates[4]))
    })
  })

  describe('#syncMonthlyStats', () => {
    let syncParams
    const dates = []

    beforeEach(async () => {
      syncParams = syncer.syncParams('1d')

      dates.push(
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -8 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -20 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -16 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -12 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -8 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -4 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -7 })
      )

      for (let i = 0; i < dates.length; i += 1) {
        const date = dates[i]
        await GlobalMarket.create({ date })
      }
    })

    it('deletes expired points', async () => {
      expect(await GlobalMarket.findAll()).to.have.length(7)
      await syncer.syncMonthlyStats(syncParams)

      const globalMarkets = await GlobalMarket.findAll()
      expect(globalMarkets).to.have.length(2)
      expect(globalMarkets[0].date).to.deep.equal(new Date(dates[0]))
      expect(globalMarkets[1].date).to.deep.equal(new Date(dates[6]))
    })
  })
})
