exports.mapUID = id => {
  switch (id) {
    case 'avalanche':
      return 'avalanche-v2'
    case 'binance-smart-chain':
      return 'binancecoin'
    case 'compound':
      return 'compound-governance-token'
    case 'curve':
      return 'curve-dao-token'
    case 'dhedge':
      return 'dhedge-dao'
    case 'dforce':
      return 'dforce-token'
    case 'elrond':
      return 'elrond-erd-2'
    case 'hurricaneswap':
      return 'hurricaneswap-token'
    case 'keeperdao':
      return 'rook'
    case 'kyber':
      return 'kyber-network-crystal'
    case 'maiar':
      return 'maiar-dex'
    case 'makerdao':
      return 'maker'
    case 'near-protocol':
      return 'near'
    case 'nexus-mutual':
      return 'nxm'
    case 'pancakeswap':
      return 'pancakeswap-token'
    case 'polygon':
      return 'matic-network'
    case 'quickswap':
      return 'quick'
    case 'reflexer':
      return 'reflexer-ungovernance-token'
    case 'sushiswap':
      return 'sushi'
    case 'synthetix':
      return 'havven'
    case 'terra':
      return 'terra-luna'
    case 'ren':
      return 'republic-protocol'
    case 'trader-joe':
      return 'joe'
    case 'lido-finance':
      return 'lido-dao'

    case 'euler':
    case 'metamask':
    case 'clipper':
    case 'volmex':
    case 'wakaswap':
    case 'opensea':
    case 'polymarket':
    default:
      return id
  }
}
