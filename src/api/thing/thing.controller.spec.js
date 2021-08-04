const request = require('supertest')
const httpStatus = require('http-status')
const { expect } = require('chai')
const app = require('../../app')

describe('Thing API', async () => {
  describe('GET /v1/thing', () => {
    it('gets "OK" message', () => {
      return request(app)
        .get('/thing')
        .expect(httpStatus.OK)
        .then(async res => {
          expect(res.body).to.eql({})
        })
    })
  })
})
