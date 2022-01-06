const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')

const AddressSyncer = require('./AddressSyncer')
const Address = require('../db/models/Address')
const Platform = require('../db/models/Platform')
const Coin = require('../db/models/Coin')

const bigquery = require('../providers/bigquery')

describe('AddressSyncer', () => {
  const now = DateTime.fromSQL('2021-01-01 00:00:00Z')
  const usdcErc20 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const coins = [
    { id: 1, uid: 'ethereum' },
    { id: 2, uid: 'usd-coin' },
  ]

  /** @type AddressSyncer */
  const syncer = new AddressSyncer()
  let clock

  beforeEach(async () => {
    clock = sinon.useFakeTimers(now.ts)
    await Coin.bulkCreate(coins)
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await Address.destroy({ truncate: true, cascade: true })
  })

  describe('#syncHistorical', () => {
    describe('Ethereum and ERC20 tokens', () => {
      const param1d = syncer.syncParamsHistorical('1d')
      const param4h = syncer.syncParamsHistorical('4h')
      const param1h = syncer.syncParamsHistorical('1h')

      beforeEach(async () => {

        await Platform.bulkCreate([
          { id: 1, type: 'ethereum', decimals: 18, coin_id: 1 },
          { id: 2, type: 'erc20', decimals: 18, coin_id: 2, address: usdcErc20 }
        ])

        sinon.stub(bigquery, 'getAddressStats')
          .returns([
            { count: 10, volume: 0, address: usdcErc20, date: { value: param1d.dateTo } }
          ])

        sinon.stub(bigquery, 'getAddressStats')
          .returns([
            { count: 11, volume: 0, address: usdcErc20, date: { value: param4h.dateTo } }
          ])

        sinon.stub(bigquery, 'getAddressStats')
          .returns([
            { count: 12, volume: 0, address: usdcErc20, date: { value: param1h.dateTo } }
          ])
      })

      it('syncs address stats', async () => {
        expect(await Address.count()).to.equal(0)
        await syncer.syncHistorical()
        expect(await Address.count()).to.equal(3)
      })
    })
  })
})
