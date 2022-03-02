const web3 = require('../../providers/web3')
const binanceDex = require('../../providers/binance-dex')

exports.info = async (req, res, next) => {
  const { address, symbol } = req.query
  const { type } = req.params

  let info

  switch (type) {
    case 'optimistic-ethereum':
    case 'mrc20':
    case 'erc20':
    case 'bep20': {
      info = await web3.getTokenInfo(address, type)
      break
    }

    case 'bep2': {
      info = await binanceDex.getTokenInfo(symbol.toUpperCase())
      break
    }

    default:
      return next()
  }

  if (info) {
    return res.send(info)
  }

  next()
}
