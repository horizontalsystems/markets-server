module.exports = {
  serialize: items => {
    return items.map(item => {
      const record = {
        uid: item.uid,
        name: item.name,
        url: item.url
      }

      if (item.evm && item.evm.chainId) {
        record.evm_chain_id = item.evm.chainId
      }

      return record
    })
  },

  serializeEvm: items => {
    return items.map((item = {}) => {
      const { isTestnet, nativeCurrency, rpc, chainId } = item.evm || {}
      const platform = {
        uid: item.uid,
        name: item.name,
        type: item.type,
        decimals: item.decimals,
        coin_uid: item.coin_uid,
        chainId,
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
