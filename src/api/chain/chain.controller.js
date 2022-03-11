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
