const express = require('express')
const RpcSource = require('../infura/RpcSource')
const { makeProxy } = require('../infura/infura.controller')

module.exports = network => {
  const router = express.Router()
  router.post('/mainnet', makeProxy(new RpcSource(network)))
  return router
}
