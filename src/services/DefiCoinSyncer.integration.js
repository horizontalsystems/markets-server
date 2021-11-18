const nock = require('nock')
const sinon = require('sinon')
const { DateTime } = require('luxon')
const { expect } = require('chai')

const { percentageBetweenNumber, utcDate } = require('../utils')
const DefiCoinSyncer = require('./DefiCoinSyncer')
const DefiCoinTvl = require('../db/models/DefiCoinTvl')
const DefiCoin = require('../db/models/DefiCoin')
const GlobalMarket = require('../db/models/GlobalMarket')

const defillama = 'https://api.llama.fi'

describe('DefiCoinSyncer', () => {
  const now = DateTime.fromSQL('2021-01-01 00:00:00Z')

  /** @type DefiCoinSyncer */
  let syncer
  let clock

  beforeEach(async () => {
    clock = sinon.useFakeTimers(now.ts)
    syncer = new DefiCoinSyncer()
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await DefiCoinTvl.destroy({ truncate: true, cascade: true })
    await DefiCoin.destroy({ truncate: true, cascade: true })
  })

  describe('#syncHistorical', () => {
    let protocol1Full
    let protocol2Full
    let protocol1List
    let protocol2List

    beforeEach(() => {
      protocol1Full = factory.defillamaProtocolFull('curve', ['Ethereum', 'Avalanche'])
      protocol2Full = factory.defillamaProtocolFull('maker', ['Ethereum'])
      protocol1List = factory.defillamaProtocol('curve', { Ethereum: 70.0, Avalanche: 30.0 })
      protocol2List = factory.defillamaProtocol('maker', { Ethereum: 70.0 })

      nock(defillama).get('/protocols').reply(200, [protocol1List, protocol2List])
      nock(defillama).get('/protocol/curve').reply(200, protocol1Full)
      nock(defillama).get('/protocol/maker').reply(200, protocol2Full)
    })

    it('syncs protocols & historical TVLs', async () => {
      expect(await DefiCoin.findAll()).to.have.length(0)
      expect(await DefiCoinTvl.findAll()).to.have.length(0)

      await syncer.syncHistorical()

      const defiCoins = await DefiCoin.findAll()
      const defiCoinTvls = await DefiCoinTvl.findAll({ order: ['defi_coin_id'] })

      expect(defiCoins).to.have.length(2)
      expect(defiCoinTvls).to.have.length(10)

      defiCoinTvls.filter(i => i.defi_coin_id === 1)
        .forEach(item => {
          const date = item.date.getTime() / 1000
          expect(protocol1Full.tvl).to.deep
            .include({ date, totalLiquidityUSD: parseFloat(item.tvl) })
          expect(protocol1Full.chainTvls.Ethereum.tvl).to.deep
            .include({ date, totalLiquidityUSD: item.chain_tvls.Ethereum })
          expect(protocol1Full.chainTvls.Avalanche.tvl).to.deep
            .include({ date, totalLiquidityUSD: item.chain_tvls.Avalanche })
        })

      defiCoinTvls.filter(i => i.defi_coin_id === 2)
        .forEach(item => {
          const date = item.date.getTime() / 1000
          expect(protocol2Full.tvl).to.deep
            .include({ date, totalLiquidityUSD: parseFloat(item.tvl) })
          expect(protocol2Full.chainTvls.Ethereum.tvl).to.deep
            .include({ date, totalLiquidityUSD: item.chain_tvls.Ethereum })
        })
    })
  })

  describe('#syncDailyStats', () => {
    let protocol1Full
    let protocol2Full
    let protocol1List
    let protocol2List

    beforeEach(() => {
      protocol1Full = factory.defillamaProtocolFull('curve', ['Ethereum', 'Avalanche'])
      protocol2Full = factory.defillamaProtocolFull('maker', ['Ethereum'])
      protocol1List = factory.defillamaProtocol('curve', { Ethereum: 70.0, Avalanche: 30.0 })
      protocol2List = factory.defillamaProtocol('maker', { Ethereum: 70.0 })

      nock(defillama).get('/protocols').reply(200, [protocol1List, protocol2List])
      nock(defillama).get('/protocol/curve').reply(200, protocol1Full)
      nock(defillama).get('/protocol/maker').reply(200, protocol2Full)
    })

    it('syncs protocols, TVLs & GlobalMarkets', async () => {
      expect(await DefiCoin.findAll()).to.have.length(0)
      expect(await DefiCoinTvl.findAll()).to.have.length(0)
      expect(await GlobalMarket.findAll()).to.have.length(0)

      await syncer.syncDailyStats(syncer.syncParams('1h'))

      const defiCoins = await DefiCoin.findAll()
      const globalMarkets = await GlobalMarket.findAll()
      const defiCoinTvls = await DefiCoinTvl.findAll()

      expect(defiCoins).to.have.length(2)
      expect(defiCoinTvls).to.have.length(2)

      expect(globalMarkets).to.have.length(1)
      expect(globalMarkets[0].dataValues).to.deep.include({
        market_cap: '0',
        defi_market_cap: '0',
        volume: '0',
        btc_dominance: '0',
        tvl: String(protocol1List.tvl + protocol2List.tvl),
        chain_tvls: {
          Ethereum: protocol1List.chainTvls.Ethereum + protocol2List.chainTvls.Ethereum,
          Avalanche: protocol1List.chainTvls.Avalanche
        }
      })
    })

    context('when tvls exists', () => {
      beforeEach(async () => {
        const dateParams = syncer.syncParams('1h')
        const date = DateTime.fromFormat(dateParams.dateTo, 'yyyy-MM-dd HH:00:00Z')
          .plus({ days: -30 })

        await DefiCoin.bulkCreate([
          { ...protocol1List, defillama_id: protocol1List.slug, tvl_rank: 1 },
          { ...protocol2List, defillama_id: protocol2List.slug, tvl_rank: 2 }
        ])

        await DefiCoinTvl.bulkCreate([
          { date: date.ts / 1000, tvl: 200.99, defi_coin_id: 1 },
          { date: date.ts / 1000, tvl: 100.99, defi_coin_id: 2 }
        ])
      })

      it('syncs protocols & latest TVLs with 30d change', async () => {
        expect(await DefiCoin.findAll()).to.have.length(2)
        expect(await DefiCoinTvl.findAll()).to.have.length(2)

        await syncer.syncDailyStats(syncer.syncParams('1h'))

        const defiCoins = await DefiCoin.findAll()
        const defiCoinTvls = await DefiCoinTvl.findAll()

        expect(defiCoinTvls).to.have.length(4)
        expect(defiCoins).to.have.length(2)

        expect(defiCoins[0].tvl_change.change_30d).to
          .equal(percentageBetweenNumber(200.99, protocol1List.tvl))
        expect(defiCoins[1].tvl_change.change_30d).to
          .equal(percentageBetweenNumber(100.99, protocol2List.tvl))
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
        await DefiCoinTvl.create({ date, tvl: 100 })
      }
    })

    it('deletes expired points', async () => {
      expect(await DefiCoinTvl.findAll()).to.have.length(5)
      await syncer.syncWeeklyStats(syncParams)

      const defiCoinTvls = await DefiCoinTvl.findAll()

      expect(defiCoinTvls).to.have.length(2)
      expect(defiCoinTvls[0].date).to.deep.equal(new Date(dates[0]))
      expect(defiCoinTvls[1].date).to.deep.equal(new Date(dates[4]))
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
        await DefiCoinTvl.create({ date, tvl: 100 })
      }
    })

    it('deletes expired points', async () => {
      expect(await DefiCoinTvl.findAll()).to.have.length(7)
      await syncer.syncMonthlyStats(syncParams)

      const defiCoinTvls = await DefiCoinTvl.findAll()
      expect(defiCoinTvls).to.have.length(2)
      expect(defiCoinTvls[0].date).to.deep.equal(new Date(dates[0]))
      expect(defiCoinTvls[1].date).to.deep.equal(new Date(dates[6]))
    })
  })
})
