const web3 = require('../../providers/web3')
const binanceDex = require('../../providers/binance-dex')

exports.info = async (req, res, next) => {
  const { address, symbol, chain } = req.query
  const { type } = req.params

  const info = type === 'bep2'
    ? await binanceDex.getTokenInfo(symbol.toUpperCase())
    : await web3.getTokenInfo(address, chain)

  if (info) {
    return res.send(info)
  }

  next()
}
