const Chain = require('../../db/models/Chain')
const Block = require('../../db/models/Block')
const serializer = require('./blockchains.serializer')
const bitquery = require('../../providers/bitquery').bitqueryProxy

exports.list = async (req, res) => {
  const chains = await Chain.findAll({
    attributes: ['uid', 'name']
  })

  res.send(serializer.serialize(chains))
}

exports.blockNumber = async ({ params }, res, next) => {
  try {
    const blockNumber = await bitquery.getBlockNumber(params.chain)
    res.send({ block_number: blockNumber })
  } catch (e) {
    console.log(e)
    next()
  }
}

exports.blockHashes = async ({ params, query }, res, next) => {
  try {
    const numbers = query.numbers || ''
    const hashes = await Block.getBlockHashes(params.chain, numbers.split(','))
    res.send(serializer.serializeHashes(hashes))
  } catch (e) {
    console.log(e)
    next()
  }
}
