const web3 = require('../../providers/web3')
const binanceDex = require('../../providers/binance-dex')

exports.info = async (req, res, next) => {
  const { address, blockchain, symbol = '' } = req.query
  const { type } = req.params

  let info

  // @deprecated old types
  switch (type) {
    case 'optimism':
    case 'arbitrum-one':
    case 'mrc20':
    case 'erc20':
    case 'bep20': {
      info = await web3.getEip20Info(address, type)
      break
    }

    case 'bep2': {
      info = await binanceDex.getBep20Info(symbol.toUpperCase())
      break
    }
    default:
      info = await web3.getEip20Info(address, blockchain)
  }

  if (info) {
    return res.send(info)
  }

  next()
}
