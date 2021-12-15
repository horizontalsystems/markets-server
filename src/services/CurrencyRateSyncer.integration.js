const querystring = require('querystring')
const nock = require('nock')
const sinon = require('sinon')
const { expect } = require('chai')
const { DateTime } = require('luxon')
const { utcDate } = require('../utils')

const CurrencyRateSyncer = require('./CurrencyRateSyncer')
const Currency = require('../db/models/Currency')
const CurrencyRate = require('../db/models/CurrencyRate')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')

const coingeckoAPIUrl = 'https://api.coingecko.com/api/v3'

describe('GlobalMarketsSyncer', () => {
  const now = DateTime.fromSQL('2021-01-01 00:00:00Z')

  /** @type GlobalMarketsSyncer */
  let syncer
  let clock
  let currencies

  beforeEach(async () => {
    clock = sinon.useFakeTimers(now.ts)
    syncer = new CurrencyRateSyncer()
    currencies = 
  })

  afterEach(async () => {
    sinon.restore()
    clock.restore()

    await CurrencyRate.destroy({ truncate: true, cascade: true })
    await Currency.destroy({ truncate: true, cascade: true })
  })

  describe('#syncHistorical', () => {
    const protocols = [
      factory.defillamaProtocolFull('curve', ['Ethereum', 'Avalanche']),
      factory.defillamaProtocolFull('maker', ['Ethereum'])
    ]

    beforeEach(() => {
      const params = {
        vs_currency: 'usd',
        from: false,
        to: 'market_cap_rank_desc',
      }
      nock(coingeckoAPIUrl).get(`/coins/tether/market_chart/range?${querystring.stringify(params)}`).reply(200, {
        stats: factory.data(5),
        total_volumes: factory.data(5)
      })

    })

    it('syncs historical currency rates', async () => {
      expect(await CurrencyRate.findAll()).to.have.length(0)
      await syncer.syncHistorical()

      const currencyRates = await CurrencyRate.findAll()
      expect(currencyRates).to.have.length(5)
    })
  })
})
