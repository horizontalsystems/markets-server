const request = require('supertest')
const httpStatus = require('http-status')
const { expect } = require('chai')
const app = require('../../app')

describe('Coins API', async () => {
  describe('GET /v1/coin', () => {
    it('gets "OK" message', () => {
      return request(app)
        .get('/coin')
        .expect(httpStatus.OK)
        .then(async res => {
          expect(res.body).to.eql({})
        })
    })
  })
})
