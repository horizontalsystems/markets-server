const sinon = require('sinon')
const request = require('supertest')
const Coin = require('../../src/db/models/Coin')
const app = require('../../src/config/express')
const CurrencyRate = require('../../src/db/models/CurrencyRate')

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

  describe('GET /v1/coins?uids=bitcoin', () => {
    const usdToEurRate = 0.86
    const coinId = 'bitcoin'
    const coin = {
      uid: coinId,
      price: 57000 // eur = 49020
    }

    beforeEach(() => {
      sinon.stub(Coin, 'findAll').returns([coin])
      sinon.stub(CurrencyRate, 'getCurrencyRate').returns({ rate: usdToEurRate })
    })

    it('tests currency converter', done => {
      request(app)
        .get('/v1/coins')
        .query({
          uids: coinId,
          fields: 'price',
          currency: 'eur'
        })
        .expect('Content-Type', /json/)
        .expect(200, [{
          uid: 'bitcoin',
          price: '49020'
        }], done)
    })
  })
})
