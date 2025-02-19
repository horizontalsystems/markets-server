const Web3EvmProvider = require('./Web3EvmProvider')
const Web3SolanaProvider = require('./Web3SolanaProvider')
const Web3TronProvider = require('./Web3TronProvider')

const ethereum = new Web3EvmProvider('https://mainnet.infura.io/v3/d13bc12e6f5a4d3bad8d80291c74c1d3')
const ethereumGoerli = new Web3EvmProvider('https://goerli.infura.io/v3/d13bc12e6f5a4d3bad8d80291c74c1d3')
const optimism = new Web3EvmProvider('https://mainnet.optimism.io')
const arbitrumOne = new Web3EvmProvider('https://arb1.arbitrum.io/rpc')
const polygon = new Web3EvmProvider('https://polygon-rpc.com')
const binance = new Web3EvmProvider('https://bsc-dataseed1.binance.org:443')
const avalanche = new Web3EvmProvider('https://rpc.ankr.com/avalanche')
const cronos = new Web3EvmProvider('https://evm.cronos.org')
const fantom = new Web3EvmProvider('https://rpc.ankr.com/fantom')
const solana = new Web3SolanaProvider('https://rpc.ankr.com/solana')
const celo = new Web3EvmProvider('https://rpc.ankr.com/celo')
const gnosis = new Web3EvmProvider('https://rpc.ankr.com/gnosis')
const tron = new Web3TronProvider('https://rpc.ankr.com/tron_jsonrpc')
const zksync = new Web3TronProvider('https://mainnet.era.zksync.io') // https://rpc.ankr.com/zksync_era

const getProvider = chainOrType => {
  switch (chainOrType) {
    case 'erc20':
    case 'ethereum':
      return ethereum
    case 'ethereum-goerli':
      return ethereumGoerli
    case 'bep20':
    case 'binance-smart-chain':
      return binance
    case 'mrc20':
    case 'polygon-pos':
      return polygon
    case 'optimism':
    case 'optimistic-ethereum':
      return optimism
    case 'arbitrum-one':
      return arbitrumOne
    case 'avalanche':
      return avalanche
    case 'cronos':
      return cronos
    case 'fantom':
      return fantom
    case 'celo':
      return celo
    case 'gnosis':
    case 'xdai':
      return gnosis
    case 'solana':
      return solana
    case 'tron':
      return tron
    case 'zksync':
      return zksync
    default:
      return null
  }
}

exports.getProvider = getProvider
exports.getEip20Info = async (contractAddress, chainOrType) => {
  try {
    const provider = getProvider(chainOrType)
    const decimals = await provider.getDecimals(contractAddress)
    const name = await provider.getName(contractAddress)
    const symbol = await provider.getSymbol(contractAddress)

    if (!decimals || !name || !symbol) {
      return null
    }

    return {
      decimals: parseInt(decimals, 10),
      name,
      symbol
    }
  } catch (e) {
    console.log(contractAddress, e)
    return null
  }
}
