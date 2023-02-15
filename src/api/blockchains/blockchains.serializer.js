module.exports = {
  serialize: items => {
    return items.map(item => ({
      uid: item.uid,
      name: item.name,
      url: item.url
    }))
  },

  serializeEvm: items => {
    return items.map((item = {}) => {
      const { isTestnet, nativeCurrency, rpc } = item.evm || {}
      const platform = {
        uid: item.uid,
        name: item.name,
        type: item.type,
        decimals: item.decimals,
        coin_uid: item.coin_uid,
        is_testnet: isTestnet,
        rpc
      }

      if (!item.coin_uid) {
        platform.decimals = nativeCurrency.decimals
        platform.type = nativeCurrency.native
      }

      return platform
    })
  },

  serializeHashes: items => {
    return items.map(item => ({
      number: item.number,
      hash: item.hash
    }))
  }
}
