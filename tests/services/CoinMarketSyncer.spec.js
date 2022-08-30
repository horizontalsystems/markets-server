const { times } = require('lodash')
const sinon = require('sinon')
const utils = require('../../src/utils')
const coingecko = require('../../src/providers/coingecko')
const Coin = require('../../src/db/models/Coin')
const Syncer = require('../../src/services/CoinPriceSyncer')

describe('CoinPriceSyncer', () => {

  /** @type CoinPriceSyncer */
  let syncer
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
    syncer = new Syncer()
  })

  afterEach(() => {
    clock.restore()
    sinon.restore()
  })

  describe('#sync', () => {
    beforeEach(() => {
      sinon.stub(syncer, 'syncCoins')
    })

    describe('when coins more than chunk size', () => {
      beforeEach(() => {
        const coins = times(401, i => ({ coingecko_id: `long-coin-name-${i}` }))
        sinon.stub(Coin, 'findAll').returns(coins)
      })

      it('syncs coins by chunk', async () => {
        sinon.assert.notCalled(syncer.syncCoins)
        await syncer.sync()
        sinon.assert.calledTwice(syncer.syncCoins)
      })
    })

    describe('when coins less than chunk size', () => {
      beforeEach(() => {
        const coins = [{ coingecko_id: 'bitcoin' }]
        sinon.stub(Coin, 'findAll').returns(coins)
      })

      it('syncs coins once', async () => {
        sinon.assert.notCalled(syncer.syncCoins)
        await syncer.sync()
        sinon.assert.calledOnce(syncer.syncCoins)
      })
    })
  })

  describe('#syncCoins', () => {
    const coins = [{ id: 1, coingecko_id: 'bitcoin' }, { id: 2, coingecko_id: 'ethereum' }]

    beforeEach(() => {
      sinon.stub(syncer, 'updateCoins')
      sinon.stub(utils, 'sleep')
    })

    describe('when fetched coins', () => {
      beforeEach(() => {
        sinon.stub(coingecko, 'getMarkets').returns(coins)
      })

      it('fetches & save coins', async () => {
        const idsMap = { bitcoin: 1, ethereum: 2 }
        await syncer.syncCoins(coins.map(coin => coin.coingecko_id), idsMap)

        sinon.assert.calledOnceWithExactly(syncer.updateCoins, coins, idsMap)
        sinon.assert.calledOnceWithExactly(utils.sleep, 2000)
      })
    })

    describe('when API responded with 429', () => {
      const reason = { response: { status: 429 } }
      const rejected = new Promise((_, reject) => {
        reject(reason)
      })

      beforeEach(() => {
        sinon.stub(coingecko, 'getMarkets').returns(rejected)
      })

      it('fetches & sleeps for 1m', async () => {
        await syncer.syncCoins(coins.map(coin => coin.coingecko_id))
        sinon.assert.calledOnceWithExactly(utils.sleep, 60000)
      })
    })

    describe('when API responded with 502', () => {
      const reason = { response: { status: 502 } }
      const rejected = new Promise((_, reject) => {
        reject(reason)
      })

      beforeEach(() => {
        sinon.stub(coingecko, 'getMarkets').returns(rejected)
      })

      it('fetches & sleeps for 30sec', async () => {
        await syncer.syncCoins(coins.map(coin => coin.coingecko_id))
        sinon.assert.calledOnceWithExactly(utils.sleep, 30000)
      })
    })
  })
})
