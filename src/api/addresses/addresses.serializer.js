const { floatToString } = require('../../utils')

exports.serializeCoinHolders = (coinHolders) => {
  return coinHolders.map((item) => ({
    address: item.address,
    share: floatToString(item.share)
  }))
}
