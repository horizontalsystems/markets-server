const querystring = require('querystring')
const sinon = require('sinon')
const nock = require('nock')
const { expect } = require('chai')
const { DateTime } = require('luxon')
const SetupCoins = require('./SetupCoins')
const Coin = require('../db/models/Coin')

const coingeckoAPI = 'https://api.coingecko.com/api/v3'

describe('SetupCoins', () => {
  const now = DateTime.fromSQL('2021-01-01 00:00:00Z')

  /** @type SetupCoins */
  let setupCoins
  let clock

  beforeEach(async () => {
    clock = sinon.useFakeTimers(now.ts)
    setupCoins = new SetupCoins()
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await Coin.destroy({ truncate: true, cascade: true })
  })

  describe('#syncCoins', () => {
    const markets = [
      factory.coingeckoMarket('bitcoin', { current_price: 100000 }),
      factory.coingeckoMarket('ethereum', { current_price: 5000 })
    ]

    beforeEach(() => {
      const params = {
        vs_currency: 'usd',
        sparkline: false,
        order: 'market_cap_rank_desc',
        price_change_percentage: '24h,7d,14d,30d,200d,1y',
        ids: markets.map(m => m.id).join(',')
      }

      nock(coingeckoAPI).get(`/coins/markets?${querystring.stringify(params)}`)
        .reply(200, markets)
    })

    it('fetches & saves coins', async () => {
      const coins = await setupCoins.syncCoins(['bitcoin', 'ethereum'], true)
      expect(coins).to.have.length(2)
      expect(coins[0].uid).to.equal('bitcoin')
      expect(coins[1].uid).to.equal('ethereum')
    })

    describe('when coin already exist', () => {
      beforeEach(async () => {
        await Coin.create({ uid: 'bitcoin' })
      })

      it('saves & returns only news ones', async () => {
        const coins = await setupCoins.syncCoins(['bitcoin', 'ethereum'], true)
        expect(coins).to.have.length(1)
        expect(coins[0].uid).to.equal('ethereum')
      })

      it('saves & returns all coins', async () => {
        const coins = await setupCoins.syncCoins(['bitcoin', 'ethereum'], false)
        expect(coins).to.have.length(2)
        expect(coins[0].uid).to.equal('bitcoin')
        expect(coins[1].uid).to.equal('ethereum')
      })
    })
  })
})
