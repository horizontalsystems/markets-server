const sinon = require('sinon')
const crypto = require('crypto')
const request = require('supertest')
const AuthKey = require('../../db/models/AuthKey')
const NftHolder = require('../../db/models/NftHolder')
const app = require('../../config/express')

describe('Auth API', async () => {
  const message = 'abc'
  const account = {
    address: '0xa5da9d340d0f8f8a6b7d3b061e6a0ed622fff596',
    privateKey: '0xe5c5ae8ed33ca6638b3130246f7d0dce7de46d34552ec959705a33999e05438c',
  }

  beforeEach(() => {
    process.env.SECRET = 'abc'
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('GET /v1/auth/get-key', () => {
    beforeEach(() => {
      sinon.stub(AuthKey, 'upsert')
      sinon.stub(crypto, 'randomBytes').returns(Buffer.from(message))
    })

    it('responds with auth key', done => {
      request(app)
        .get('/v1/auth/get-key')
        .query({ address: account.address })
        .expect('Content-Type', /json/)
        .expect(200, {
          key: 'YWJj'
        }, done)
    })
  })

  describe('GET /v1/auth/authenticate', () => {
    beforeEach(async () => {
      sinon.stub(NftHolder, 'findOne').returns({ address: account.address })
      sinon.stub(AuthKey, 'getValidKey').returns({
        key: 'YWJj',
        destroy: sinon.stub()
      })
    })

    it('generates token', done => {
      request(app)
        .post('/v1/auth/authenticate')
        .send({
          signature: '0x4bb69512624e8c7a4d5f2ec98f6027bed7e9d64d903672da0f226fcc40b8c4a92355dac9557b68916ff908b9101d6ccc7c9657e019aa34e6e15742ded71a4c071c',
          address: account.address
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, { body }) => {
          if (!body.token) {
            return done('No token found')
          }

          done(err)
        })
    })
  })

})
