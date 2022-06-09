exports.normalizeUsdt = ({ data } = {}) => {
  const { usdt } = data
  if (!usdt) {
    return {}
  }

  return {
    omni: usdt.totaltokens_omni,
    algo: usdt.totaltokens_algo,
    eos: usdt.totaltokens_eos,
    solana: usdt.totaltokens_sol,
    ethereum: usdt.totaltokens_eth,
    liq: usdt.totaltokens_liq,
    slp: usdt.totaltokens_slp,
    tron: usdt.totaltokens_tron,
    avalanche: usdt.totaltokens_ava
  }
}

exports.normalizeUsdc = ({ data } = []) => {
  const { chains } = data[0] || {}

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
