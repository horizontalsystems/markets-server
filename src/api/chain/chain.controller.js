const Block = require('../../db/models/Block')
const serializer = require('./chain.serializer')
const bitquery = require('../../providers/bitquery').bitqueryProxy

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
