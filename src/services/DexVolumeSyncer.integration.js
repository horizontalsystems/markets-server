const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')
const { bitquery } = require('../providers/bitquery')
const bigquery = require('../providers/bigquery')
const DexVolumeSyncer = require('./DexVolumeSyncer')
const DexVolume = require('../db/models/DexVolume')
const Platform = require('../db/models/Platform')
const Coin = require('../db/models/Coin')
const Chain = require('../db/models/Chain')

describe('DexVolumeSyncer', async () => {
  const date = DateTime.fromISO('2021-01-01T00:00:00Z')
  const syncer = new DexVolumeSyncer()

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
    await Chain.bulkCreate([{ uid: 'ethereum', name: 'Ethereum' }])
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await factory.truncate(DexVolume, Platform, Coin)
  })

  describe('#syncHistorical', () => {
    let dataParams

    beforeEach(() => {
      dataParams = syncer.syncParamsHistorical('1d')

      sinon.stub(bigquery, 'getDexVolumes').returns([])
      sinon.stub(bitquery, 'getDexVolumes').returns([])
    })

    describe('Ethereum and ERC20 tokens', () => {
      beforeEach(async () => {
        await Platform.bulkCreate([
          { id: 1, type: 'ethereum', decimals: 18, coin_id: 1, chain_uid: 'ethereum' },
          { id: 2, type: 'erc20', decimals: 18, coin_id: 2, address: usdcErc20, chain_uid: 'ethereum' }
        ])

        bigquery.getDexVolumes.returns([
          { volume: 100, address: usdcErc20, date: { value: dataParams.dateFrom } }
        ])
      })

      it('synchronizes uniswap/sushi', async () => {
        expect(await DexVolume.count()).to.equal(0)
        await syncer.syncHistorical()
        expect(await DexVolume.count()).to.equal(3)
      })
    })

    describe('BinanceSmartChain and BEP20 tokens', () => {
      beforeEach(async () => {
        await Platform.bulkCreate([
          { id: 3, type: 'bep20', decimals: 18, coin_id: 2, address: usdcBep20, chain_uid: 'ethereum' }
        ])

        bitquery.getDexVolumes.returns([
          { tradeAmount: 100, baseCurrency: { address: usdcBep20 }, date: { value: dataParams.dateFrom } }
        ])
      })

      it('synchronizes uniswap', async () => {
        expect(await DexVolume.count()).to.equal(0)
        await syncer.syncHistorical()
        expect(await DexVolume.count()).to.equal(1)
      })
    })
  })
})
