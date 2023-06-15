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

exports.normalizeRevenue = items => {
  const mapUid = uid => {
    const map = {
      quickswap: 'quick',
      polygon: 'matic-network',
      'binance-smart-chain': 'binancecoin',
      'arbitrum-exchange': 'arbitrum-exchange',
      SmarDex: 'smardex',
      apeswap: 'apeswap-finance',
      babydogeswap: 'baby-doge-coin',
      balancer: 'balancer',
      biswap: 'biswap',
      camelot: 'camelot-token',
      chronos: 'chronos-finance',
      'curve-finance': 'curve-dao-token',
      'defi-swap': 'crypto-com-chain',
      dodo: 'dodo',
      'el-dorado-exchange': 'el-dorado-exchange',
      elk: 'elk-finance',
      'equalizer-exchange': 'equalizer-dex',
      'frax-finance': 'frax-share',
      gmx: 'gmx',
      honeyswap: 'honey',
      kyberswap: 'kyber-network-crystal',
      'level-finance': 'level',
      lifinity: 'lifinity',
      merlin: 'merlin',
      mojitoswap: 'mojitoswap',
      'mummy-finance': 'mummy-finance',
      nomiswap: 'nominex',
      pangolin: 'pangolin',
      radioshack: 'radioshack',
      'ramses-exchange': 'ramses-exchange',
      raydium: 'raydium',
      shibaswap: 'bone-shibaswap',
      solarbeam: 'solarbeam',
      solidlizard: 'solidlizard',
      spiritswap: 'spiritswap',
      spookyswap: 'spookyswap',
      stellaswap: 'stellaswap',
      sushi: 'sushi',
      thena: 'thena',
      velodrome: 'velodrome-finance',
      verse: 'verse-bitcoin',
      'wombat-exchange': 'wombat-exchange',
      woofi: 'woo-network',
      zyberswap: 'zyberswap',
      aave: 'aave',
      abracadabra: 'spell-token',
      angle: 'angle-protocol',
      arbitrum: 'arbitrum',
      aura: 'aura-finance',
      avalanche: 'avalanche-v2',
      betswirl: 'betswirl',
      bitcoin: 'bitcoin',
      'compound-finance': 'compound-governance-token',
      'cryptex-finance': 'cryptex-finance',
      ens: 'ethereum-name-service',
      'frax-fpi': 'frax-price-index-share',
      'gains-network': 'gains-network',
      gamma: 'gamma-strategies',
      gearbox: 'gearbox',
      'geist-finance': 'geist-finance',
      'get-protocol': 'get-token',
      ghostmarket: 'ghostmarket',
      'gnd-protocol': 'gnd-protocol',
      'houdini-swap': 'poof-token',
      lido: 'lido-dao',
      liquity: 'liquity',
      looksrare: 'looksrare',
      'lybra-finance': 'lybra-finance',
      nftearth: 'nftearth',
      paraswap: 'paraswap',
      radiant: 'radiant-capital',
      'sonne-finance': 'sonne-finance',
      stargate: 'stargate-finance',
      stride: 'stride',
      synapse: 'synapse-2',
      tarot: 'tarot',
      unibot: 'unibot',
      unidex: 'unidex',
      'valas-finance': 'valas-finance',
      'vesta-finance': 'vesta-finance',
      x2y2: 'x2y2',
      uniswap: 'uniswap'
    }

    return map[uid] || uid
  }

  const result = {}
  const setData = (uid, data) => {
    const prev = result[uid]
    if (prev) {
      result[uid] = {
        uid: mapUid(uid),
        total24h: prev.total24h + data.total24h,
        total7d: prev.total7d + data.total7d,
        total30d: prev.total30d + data.total30d
      }
    } else {
      result[uid] = {
        uid: mapUid(uid),
        total24h: data.total24h,
        total7d: data.total7d,
        total30d: data.total30d
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
