exports.normalizeUsdt = ({ data } = {}) => {
  const { usdt } = data
  if (!usdt) {
    return {}
  }

  return {
    ethereum: usdt.totaltokens_eth,
    omni: usdt.totaltokens_omni,
    algorand: usdt.totaltokens_algo,
    eos: usdt.totaltokens_eos,
    solana: usdt.totaltokens_sol,
    liq: usdt.totaltokens_liq,
    slp: usdt.totaltokens_slp,
    tron: usdt.totaltokens_tron,
    tezos: usdt.totaltokens_tezos,
    avalanche: usdt.totaltokens_ava,
    'polygon-pos': usdt.totaltokens_polygon
  }
}

exports.normalizeUsdc = ({ data } = []) => {
  const { chains } = data.find(item => item.symbol === 'USDC') || {}

  if (!chains) {
    return {}
  }

  const normalizeKey = key => {
    switch (key) {
      case 'eth':
        return 'ethereum'
      case 'sol':
        return 'solana'
      case 'trx':
        return 'tron'
      case 'avax':
        return 'avalanche'
      case 'algo':
        return 'algorand'
      case 'xlm':
        return 'stellar'
      case 'hbar':
        return 'hedera-hashgraph'
      default:
        return key
    }
  }

  return chains.reduce((map, item) => {
    return {
      ...map,
      [normalizeKey(item.chain.toLowerCase())]: item.amount
    }
  }, {})
}
