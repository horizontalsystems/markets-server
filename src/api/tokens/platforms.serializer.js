const { nullOrInteger } = require('../../utils')

exports.serialize = platforms => {
  return platforms.map(item => {
    const platform = {
      type: item.type,
      coin_uid: item.coin_uid,
      blockchain_uid: item.chain_uid
    }

    if (item.address) {
      platform.address = item.address
    }

    if (item.decimals || item.decimals === 0) {
      platform.decimals = nullOrInteger(item.decimals)
    }

    if (item.symbol) {
      platform.symbol = item.symbol
    }

    return platform
  })
}
