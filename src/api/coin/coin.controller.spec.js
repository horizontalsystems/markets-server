const sinon = require('sinon')
const request = require('supertest')

const Coin = require('../../db/models/Coin')
const app = require('../../config/express')

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
})
