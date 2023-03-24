exports.normalize = data => {
  const mapChain = chain => {
    switch (chain) {
      case 'BSC':
        return 'binance-smart-chain'
      case 'Polygon':
        return 'polygon-pos'
      case 'Arbitrum':
        return 'arbitrum-one'
      case 'Optimism':
        return 'optimistic-ethereum'
      case 'Terra Classic':
        return 'terra'
      case 'EthereumClassic':
        return 'ethereum-classic'
      case 'TomoChain':
        return 'tomochain'
      case 'Kardia':
        return 'kardiachain'
      case 'OKExChain':
        return 'okex-chain'
      case 'metis':
        return 'metis-andromeda'
      case 'Arbitrum Nova':
        return 'arbitrum-nova'
      case 'Klaytn':
        return 'klay-token'
      case 'harmony':
        return 'harmony-shard-0'
      case 'near':
        return 'near-protocol'
      default:
        return chain.toLowerCase()
    }
  }

  return data.reduce((res, item) => {
    return {
      ...res,
      [item.gecko_id]: item.chains.reduce((supplies, chain) => {
        const supply = item.chainCirculating[chain].current.peggedUSD

        return {
          ...supplies,
          [mapChain(chain)]: supply
        }
      }, {})
    }
  }, {})
}
