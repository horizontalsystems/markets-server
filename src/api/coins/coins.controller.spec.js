const sinon = require('sinon')
const request = require('supertest')
const Coin = require('../../db/models/Coin')
const app = require('../../config/express')
const CurrencyPrice = require('../../db/models/CurrencyPrice')

describe('Coins API', async () => {

  afterEach(() => {
    sinon.restore()
  })

  describe('GET /v1/coins', () => {
    beforeEach(() => {
      sinon.stub(Coin, 'findAll').returns([])
    })

    it('responds with json', done => {
      request(app)
        .get('/v1/coins')
        .expect('Content-Type', /json/)
        .expect(200, done)
    })
  })

  describe('GET /v1/coins/prices', () => {
    const usdToEurPrice = 0.86
    const marketPrice = {
      uid: 'bitcoin',
      price: 57000, // eur = 49020
      price_change_24h: 1,
      last_updated: 1634029699
    }

    beforeEach(() => {
      sinon.stub(Coin, 'getPrices').returns([marketPrice])
      sinon.stub(CurrencyPrice, 'getLatestCurrencyPrice').returns(usdToEurPrice)
    })

    it('tests currency converter', done => {
      request(app)
        .get('/v1/coins/prices')
        .query({
          uids: 'bitcoin',
          currency: 'eur'
        })
        .expect('Content-Type', /json/)
        .expect(200, {
          bitcoin: {
            price: String(57000 * usdToEurPrice),
            price_change_24h: '1',
            last_updated: 1634029699
          }
        }, done);
    })

    it('validates currency code parameter ', done => {
      request(app)
        .get('/v1/coins/prices')
        .query({
          uids: 'bitcoin',
          currency: 'seur'
        })
        .expect(422, done);
    })
  })

})
