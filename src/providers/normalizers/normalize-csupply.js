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
    'avalanche-2': usdt.totaltokens_ava
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
        return 'avalanche-2'
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
