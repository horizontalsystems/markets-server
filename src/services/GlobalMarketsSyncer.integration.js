const nock = require('nock')
const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')
const { utcDate } = require('../utils')

const GlobalMarketsSyncer = require('./GlobalMarketsSyncer')
const GlobalMarket = require('../db/models/GlobalMarket')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')

const defillamaURL = 'https://api.llama.fi'
const coingeckoURL = 'https://www.coingecko.com'
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
      nock(coingeckoURL).get('/market_cap/total_charts_data?vs_currency=usd').reply(200, {
        stats: factory.data(5),
        total_volumes: factory.data(5)
      })
      nock(coingeckoURL).get('/global_charts/market_dominance_data?duration=60').reply(200, {
        series_data_array: [{
          name: 'BTC',
          data: factory.data(5)
        }]
      })
      nock(coingeckoURL).get('/en/defi_market_cap_data?vs_currency=usd&duration=60').reply(200, [{
        name: 'DeFi',
        data: factory.data(5)
      }])

      nock(defillamaURL).get('/protocols').reply(200, protocols)
      nock(defillamaURL).get('/charts').reply(200, factory.data(5, mapper))
      nock(defillamaURL).get('/charts/Ethereum').reply(200, factory.data(5, mapper))
      nock(defillamaURL).get('/charts/Avalanche').reply(200, factory.data(5, mapper))
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
    const protocols = {
      protocol1: factory.defillamaProtocol('curve', { Ethereum: 70.0, Avalanche: 30.0 }),
      protocol2: factory.defillamaProtocol('maker', { Ethereum: 70.0 })
    }

    beforeEach(() => {
      syncParams = syncer.syncParams('30m')
    })

    describe('when fetched market data', () => {
      beforeEach(() => {
        nock(coingeckoAPI).get('/global')
          .reply(200, { data: globalMarketData })
        nock(coingeckoAPI).get('/global/decentralized_finance_defi')
          .reply(200, { data: defiMarketData })
        nock(defillamaURL).get('/protocols')
          .reply(200, [protocols.protocol1, protocols.protocol2])
      })

      it('syncs fetched data', async () => {
        expect(await GlobalMarket.findAll()).to.have.length(0)
        await syncer.syncDailyStats(syncParams)

        const globalMarkets = await GlobalMarket.findAll()
        expect(globalMarkets).to.have.length(1)
        expect(globalMarkets[0].dataValues).to.deep.include({
          date: new Date(syncParams.dateTo),
          market_cap: String(globalMarketData.total_market_cap.usd),
          defi_market_cap: String(defiMarketData.defi_market_cap),
          volume: String(globalMarketData.total_volume.usd),
          btc_dominance: String(globalMarketData.market_cap_percentage.btc),
          tvl: '170',
          chain_tvls: { Ethereum: 140, Avalanche: 30 }
        })
      })
    })

    describe('when fetched market data in second time', () => {
      beforeEach(() => {
        sinon.stub(utils, 'sleep')
        sinon.spy(coingecko, 'getGlobalMarkets')
        sinon.spy(coingecko, 'getGlobalDefiMarkets')

        nock(coingeckoAPI).get('/global')
          .times(1)
          .reply(504)
        nock(coingeckoAPI).get('/global')
          .reply(200, { data: globalMarketData })
        nock(coingeckoAPI).get('/global/decentralized_finance_defi')
          .reply(200, { data: defiMarketData })
        nock(defillamaURL).get('/protocols')
          .reply(200, [protocols.protocol1, protocols.protocol2])
      })

      it('syncs fetched data', async () => {
        expect(await GlobalMarket.findAll()).to.have.length(0)
        sinon.assert.notCalled(coingecko.getGlobalMarkets)

        await syncer.syncDailyStats(syncParams)

        sinon.assert.calledTwice(coingecko.getGlobalMarkets)
        const globalMarkets = await GlobalMarket.findAll()

        expect(globalMarkets).to.have.length(1)
        expect(globalMarkets[0].dataValues).to.deep.include({
          date: new Date(syncParams.dateTo),
          market_cap: String(globalMarketData.total_market_cap.usd),
          defi_market_cap: String(defiMarketData.defi_market_cap),
          volume: String(globalMarketData.total_volume.usd),
          btc_dominance: String(globalMarketData.market_cap_percentage.btc),
          tvl: '170',
          chain_tvls: { Ethereum: 140, Avalanche: 30 }
        })
      })
    })

    describe('when failed to fetch market data', () => {
      beforeEach(() => {
        sinon.stub(utils, 'sleep')
        sinon.spy(coingecko, 'getGlobalMarkets')
        sinon.spy(coingecko, 'getGlobalDefiMarkets')

        nock(coingeckoAPI).get('/global')
          .times(3)
          .reply(504)
      })

      it('retries to fetch data 3 times', async () => {
        expect(await GlobalMarket.findAll()).to.have.length(0)
        sinon.assert.notCalled(coingecko.getGlobalMarkets)

        await syncer.syncDailyStats(syncParams)

        expect(await GlobalMarket.findAll()).to.have.length(0)
        sinon.assert.calledThrice(coingecko.getGlobalMarkets)
      })
    })
  })

  describe('#syncMonthlyStats', () => {
    let syncParams
    const dates = []

    beforeEach(async () => {
      syncParams = syncer.syncParams('1d')

      dates.push(
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -31 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -30, hours: -20 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -30, hours: -16 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -30, hours: -12 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -30, hours: -8 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -30, hours: -4 }),
        utcDate('yyyy-MM-dd HH:00:00Z', { days: -30 })
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
