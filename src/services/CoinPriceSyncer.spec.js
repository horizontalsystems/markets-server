const { times } = require('lodash')
const sinon = require('sinon')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const Syncer = require('./CoinPriceSyncer')

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
        const coins = times(401, i => ({ uid: `name-${i}` }))
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
        const coins = [{ uid: 'bitcoin' }]
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
    const coins = [{ uid: 'bitcoin' }, { uid: 'ethereum' }]

    beforeEach(() => {
      sinon.stub(syncer, 'updateCoins')
      sinon.stub(utils, 'sleep')
    })

    describe('when fetched coins', () => {
      beforeEach(() => {
        sinon.stub(coingecko, 'getMarkets').returns(coins)
      })

      it('fetches & save coins', async () => {
        await syncer.syncCoins(coins.map(coin => coin.uid))

        sinon.assert.calledOnceWithExactly(syncer.updateCoins, coins)
        sinon.assert.calledOnceWithExactly(utils.sleep, 1200)
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
        await syncer.syncCoins(coins.map(coin => coin.uid))
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
        await syncer.syncCoins(coins.map(coin => coin.uid))
        sinon.assert.calledOnceWithExactly(utils.sleep, 30000)
      })
    })
  })
})
