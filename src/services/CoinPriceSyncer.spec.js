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

    sinon.spy(syncer.cron, 'start')
    sinon.spy(syncer.cron, 'stop')
  })

  afterEach(() => {
    clock.restore()
    sinon.restore()
  })

  describe('#start', () => {
    it('starts cron job', () => {
      sinon.assert.notCalled(syncer.cron.start)
      syncer.start()
      sinon.assert.calledOnce(syncer.cron.start)
    })
  })

  describe('#pause', () => {
    it('stops cron job', () => {
      sinon.assert.notCalled(syncer.cron.stop)
      syncer.pause()
      sinon.assert.calledOnce(syncer.cron.stop)
    })
  })

  describe('#syncSchedule', () => {
    const coins = [{ uid: 'bitcoin' }]

    beforeEach(() => {
      sinon.stub(Coin, 'findAll').returns(coins)
      sinon.stub(syncer, 'syncCoins')
    })

    it('pauses cron & syncs coins & starts cron again', async () => {
      sinon.assert.notCalled(syncer.cron.start)
      sinon.assert.notCalled(syncer.syncCoins)
      sinon.assert.notCalled(syncer.cron.stop)

      await syncer.syncSchedule()

      sinon.assert.callOrder(
        syncer.cron.stop,
        syncer.syncCoins,
        syncer.cron.start
      )
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
