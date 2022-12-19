const erc20Abi = require('./abi/erc20-abi.json')

const Web3EvmProvider = require('./Web3EvmProvider')
const Web3SolanaProvider = require('./Web3SolanaProvider')

const ethereum = new Web3EvmProvider('https://mainnet.infura.io/v3/d13bc12e6f5a4d3bad8d80291c74c1d3', erc20Abi)
const ethereumGoerli = new Web3EvmProvider('https://goerli.infura.io/v3/d13bc12e6f5a4d3bad8d80291c74c1d3', erc20Abi)
const optimism = new Web3EvmProvider('https://mainnet.optimism.io', erc20Abi)
const arbitrumOne = new Web3EvmProvider('https://arb1.arbitrum.io/rpc', erc20Abi)
const polygon = new Web3EvmProvider('https://polygon-rpc.com', erc20Abi)
const binance = new Web3EvmProvider('https://bsc-dataseed1.binance.org:443', erc20Abi)
const avalanche = new Web3EvmProvider('https://rpc.ankr.com/avalanche', erc20Abi)
const cronos = new Web3EvmProvider('https://evm.cronos.org', erc20Abi)
const fantom = new Web3EvmProvider('https://rpc.ankr.com/fantom', erc20Abi)
const solana = new Web3SolanaProvider('https://rpc.ankr.com/solana') // SPL
const celo = new Web3EvmProvider('https://rpc.ankr.com/celo', erc20Abi)

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
    case 'solana':
      return solana
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
