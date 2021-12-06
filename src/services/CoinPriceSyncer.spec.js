const sinon = require('sinon')
const { expect } = require('chai')
const { CronJob } = require('cron')

const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')
const Syncer = require('./CoinPriceSyncer')

describe('CoinPriceSyncer', () => {
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

  describe('#constructor', () => {
    it('creates cron job', () => {
      expect(syncer.cron).instanceof(CronJob)
    })
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
    beforeEach(() => {
      this.findAllStub = sinon.stub(Coin, 'findAll').returns([])
      this.updateCoinsStub = sinon.stub(Coin, 'updateCoins')
    })

    it('pauses & starts cron ', async () => {
      const syncCoinsStub = sinon.stub(syncer, 'syncCoins')
      sinon.assert.notCalled(syncer.cron.start)
      sinon.assert.notCalled(syncCoinsStub)
      sinon.assert.notCalled(syncer.cron.stop)

      await syncer.syncSchedule()

      sinon.assert.callOrder(
        syncer.cron.stop,
        syncCoinsStub,
        syncer.cron.start
      )
    })
  })

  describe('#syncCoins', () => {
    const coins = [{ uid: 'bitcoin' }, { uid: 'ethereum' }]

    beforeEach(() => {
      this.updateCoinsStub = sinon.stub(syncer, 'updateCoins')
      this.sleepStub = sinon.stub(utils, 'sleep')
    })

    it('fetches coins and saves', async () => {
      const coinsIds = ['bitcoin', 'ethereum']
      const fetchCoinsStub = sinon.stub(syncer, 'fetchCoins').returns(coins)

      await syncer.syncCoins(coinsIds)
      sinon.assert.calledOnceWithExactly(fetchCoinsStub, ['bitcoin', 'ethereum'])
      sinon.assert.calledOnceWithExactly(this.updateCoinsStub, coins)

      sinon.assert.notCalled(this.sleepStub)
    })

    it('fetches coins by chunk cyclically', async () => {
      const coinsIds = []

      for (let i = 0; i < 800; i += 1) {
        coinsIds.push(`coin-${i}`)
      }

      const fetchCoinsStub = sinon.stub(syncer, 'fetchCoins').returns(coins)

      const chunks1 = coinsIds.slice(0, 400)
      const chunks2 = coinsIds.slice(400, 800)

      await syncer.syncCoins(coinsIds)

      sinon.assert.callCount(fetchCoinsStub, 2)
      sinon.assert.calledWith(fetchCoinsStub, chunks1)
      sinon.assert.calledWith(fetchCoinsStub, chunks2)
      sinon.assert.calledTwice(this.updateCoinsStub)

      sinon.assert.calledOnce(this.sleepStub)
    })
  })

  describe('#fetchCoins', () => {
    beforeEach(() => {
      this.sleepStub = sinon.stub(utils, 'sleep')
    })

    it('fetches & sleeps for 30s when api responded with 429', async () => {
      const reason = { response: { status: 429 } }
      const rejected = new Promise((_, reject) => {
        reject(reason)
      })
      sinon.stub(coingecko, 'getMarkets').returns(rejected)

      await syncer.fetchCoins(['bitcoin', 'ethereum'])
      sinon.assert.calledOnce(this.sleepStub)
    })
  })
})
