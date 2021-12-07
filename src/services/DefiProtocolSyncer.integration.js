const nock = require('nock')
const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')

const utils = require('../utils')
const DefiProtocolSyncer = require('./DefiProtocolSyncer')
const DefiProtocol = require('../db/models/DefiProtocol')
const DefiProtocolTvl = require('../db/models/DefiProtocolTvl')

const defillama = 'https://api.llama.fi'

describe('DefiProtocolSyncer', () => {
  const now = DateTime.fromSQL('2021-01-01 00:00:00Z')

  /** @type DefiProtocolSyncer */
  let syncer
  let clock

  beforeEach(async () => {
    clock = sinon.useFakeTimers(now.ts)
    syncer = new DefiProtocolSyncer()
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await DefiProtocolTvl.destroy({ truncate: true, cascade: true })
    await DefiProtocol.destroy({ truncate: true, cascade: true })
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
      nock(defillama).get('/protocol/curve').times(1).reply(200, protocol1Full)
      nock(defillama).get('/protocol/maker').times(1).reply(200, protocol2Full)

      sinon.stub(utils, 'sleep')
    })

    it('syncs protocols & historical TVLs', async () => {
      expect(await DefiProtocol.findAll()).to.have.length(0)
      expect(await DefiProtocolTvl.findAll()).to.have.length(0)

      await syncer.syncHistorical()

      const defiProtocols = await DefiProtocol.findAll()
      const defiProtocolTvls = await DefiProtocolTvl.findAll({ order: ['defi_protocol_id'] })
      const curveTvls = defiProtocolTvls.filter(i => i.defi_protocol_id === 1)
      const makerTvls = defiProtocolTvls.filter(i => i.defi_protocol_id === 2)

      expect(defiProtocols).to.have.length(2)
      expect(defiProtocolTvls).to.have.length(10)

      curveTvls.forEach(item => {
        const date = item.date.getTime() / 1000
        expect(protocol1Full.tvl).to.deep
          .include({ date, totalLiquidityUSD: parseFloat(item.tvl) })
        expect(protocol1Full.chainTvls.Ethereum.tvl).to.deep
          .include({ date, totalLiquidityUSD: item.chain_tvls.Ethereum })
        expect(protocol1Full.chainTvls.Avalanche.tvl).to.deep
          .include({ date, totalLiquidityUSD: item.chain_tvls.Avalanche })
      })

      makerTvls.forEach(item => {
        const date = item.date.getTime() / 1000
        expect(protocol2Full.tvl).to.deep
          .include({ date, totalLiquidityUSD: parseFloat(item.tvl) })
        expect(protocol2Full.chainTvls.Ethereum.tvl).to.deep
          .include({ date, totalLiquidityUSD: item.chain_tvls.Ethereum })
      })
    })

    describe('force sync protocols historical tvls', () => {
      let makerProtocolFull

      beforeEach(async () => {
        await syncer.syncHistorical()

        makerProtocolFull = factory.defillamaProtocolFull('maker', ['Solana'])
        nock(defillama).get('/protocol/maker').times(2).reply(200, makerProtocolFull)
      })

      it('clears protocols tvl and re-syncs', async () => {
        await syncer.syncHistorical(['maker'])

        const defiProtocols = await DefiProtocol.findAll()
        const defiProtocolTvls = await DefiProtocolTvl.findAll({ order: ['defi_protocol_id'] })
        const makerTvls = defiProtocolTvls.filter(i => i.defi_protocol_id === 2)

        expect(defiProtocols).to.have.length(2)
        expect(defiProtocolTvls).to.have.length(10)

        makerTvls.forEach(item => {
          const date = item.date.getTime() / 1000
          expect(makerProtocolFull.tvl).to.deep
            .include({ date, totalLiquidityUSD: parseFloat(item.tvl) })
          expect(makerProtocolFull.chainTvls.Solana.tvl).to.deep
            .include({ date, totalLiquidityUSD: item.chain_tvls.Solana })
        })
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

    it('syncs protocols & TVLs', async () => {
      expect(await DefiProtocol.findAll()).to.have.length(0)
      expect(await DefiProtocolTvl.findAll()).to.have.length(0)

      await syncer.syncDailyStats(syncer.syncParams('1h'))

      const defiProtocols = await DefiProtocol.findAll()
      const defiProtocolTvls = await DefiProtocolTvl.findAll()

      expect(defiProtocols).to.have.length(2)
      expect(defiProtocolTvls).to.have.length(2)
    })

    context('when tvls exists', () => {
      beforeEach(async () => {
        const dateParams = syncer.syncParams('1h')
        const date = DateTime.fromFormat(dateParams.dateTo, 'yyyy-MM-dd HH:00:00Z')
          .plus({ days: -30 })

        await DefiProtocol.bulkCreate([
          { ...protocol1List, defillama_id: protocol1List.slug, tvl_rank: 1 },
          { ...protocol2List, defillama_id: protocol2List.slug, tvl_rank: 2 }
        ])

        await DefiProtocolTvl.bulkCreate([
          { date: date.ts / 1000, tvl: 200.99, defi_protocol_id: 1 },
          { date: date.ts / 1000, tvl: 100.99, defi_protocol_id: 2 }
        ])
      })

      it('syncs protocols & latest TVLs with 30d change', async () => {
        expect(await DefiProtocol.findAll()).to.have.length(2)
        expect(await DefiProtocolTvl.findAll()).to.have.length(2)

        await syncer.syncDailyStats(syncer.syncParams('1h'))

        const defiProtocols = await DefiProtocol.findAll()
        const defiProtocolTvls = await DefiProtocolTvl.findAll()

        expect(defiProtocolTvls).to.have.length(4)
        expect(defiProtocols).to.have.length(2)

        expect(defiProtocols[0].tvl_change.change_30d).to
          .equal(utils.percentageBetweenNumber(200.99, protocol1List.tvl))
        expect(defiProtocols[1].tvl_change.change_30d).to
          .equal(utils.percentageBetweenNumber(100.99, protocol2List.tvl))
      })
    })
  })

  describe('#syncWeeklyStats', () => {
    let syncParams
    const dates = []

    beforeEach(async () => {
      syncParams = syncer.syncParams('4h')

      dates.push(
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -4 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -3 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -2 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -1, hours: -1 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -1 })
      )

      for (let i = 0; i < dates.length; i += 1) {
        const date = dates[i]
        await DefiProtocolTvl.create({ date, tvl: 100 })
      }
    })

    it('deletes expired points', async () => {
      expect(await DefiProtocolTvl.findAll()).to.have.length(5)

      await syncer.syncWeeklyStats(syncParams)

      const defiProtocolTvls = await DefiProtocolTvl.findAll()

      expect(defiProtocolTvls).to.have.length(2)
      expect(defiProtocolTvls[0].date).to.deep.equal(new Date(dates[0]))
      expect(defiProtocolTvls[1].date).to.deep.equal(new Date(dates[4]))
    })
  })

  describe('#syncMonthlyStats', () => {
    let syncParams
    const dates = []

    beforeEach(async () => {
      syncParams = syncer.syncParams('1d')

      dates.push(
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -8 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -20 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -16 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -12 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -8 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -7, hours: -4 }),
        utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -7 })
      )

      for (let i = 0; i < dates.length; i += 1) {
        const date = dates[i]
        await DefiProtocolTvl.create({ date, tvl: 100 })
      }
    })

    it('deletes expired points', async () => {
      expect(await DefiProtocolTvl.findAll()).to.have.length(7)

      await syncer.syncMonthlyStats(syncParams)

      const defiProtocolTvls = await DefiProtocolTvl.findAll()

      expect(defiProtocolTvls).to.have.length(2)
      expect(defiProtocolTvls[0].date).to.deep.equal(new Date(dates[0]))
      expect(defiProtocolTvls[1].date).to.deep.equal(new Date(dates[6]))
    })
  })
})
