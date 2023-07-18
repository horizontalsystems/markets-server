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

exports.normalizeRevenue = (items, isFee) => {
  const mapUid = uid => {
    const map = {
      polygon: 'matic-network',
      pancakeswap: 'pancakeswap-token',
      lido: 'lido-dao',
      'convex-finance': 'convex-finance',
      bsc: 'binancecoin',
      'level-finance': 'level',
      synthetix: 'havven',
      radiant: 'radiant-capital',
      avalanche: 'avalanche-v2',
      'curve-finance': 'curve-dao-token',
      ens: 'ethereum-name-service',
      aura: 'aura-finance',
      camelot: 'camelot-token',
      stargate: 'stargate-finance',
      SmarDex: 'smardex',
      apeswap: 'apeswap-finance',
      babydogeswap: 'baby-doge-coin',
      chronos: 'chronos-finance',
      'defi-swap': 'crypto-com-chain',
      elk: 'elk-finance',
      'equalizer-exchange': 'equalizer-dex',
      'frax-finance': 'frax-share',
      honeyswap: 'honey',
      kyberswap: 'kyber-network-crystal',
      nomiswap: 'nominex',
      shibaswap: 'bone-shibaswap',
      velodrome: 'velodrome-finance',
      verse: 'verse-bitcoin',
      'wombat-exchange': 'wombat-exchange',
      woofi: 'woo-network',
      abracadabra: 'spell-token',
      angle: 'angle-protocol',
      'compound-finance': 'compound-governance-token',
      'frax-fpi': 'frax-price-index-share',
      gamma: 'gamma-strategies',
      'get-protocol': 'get-token',
      'houdini-swap': 'poof-token',
      synapse: 'synapse-2',
    }

    return map[uid] || uid
  }

  const result = {}
  const setData = (uid, data) => {
    const prev = result[uid]
    const methodology = data.methodology || {}
    const desc = isFee ? methodology.Fees : methodology.Revenue

    if (prev) {
      result[uid] = {
        uid: mapUid(uid),
        total24h: prev.total24h + data.total24h,
        total7d: prev.total7d + data.total7d,
        total30d: prev.total30d + data.total30d,
        desc
      }
    } else {
      result[uid] = {
        uid: mapUid(uid),
        total24h: data.total24h,
        total7d: data.total7d,
        total30d: data.total30d,
        desc
      }
    }
  }

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]

    if (item.parentProtocol) {
      const uid = item.parentProtocol.split('#')[1]
      setData(uid, item)
    } else {
      setData(item.module, item)
    }
  }

  return Object.values(result)
}
