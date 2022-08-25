const Web3 = require('web3')
const erc20Abi = require('./abi/erc20-abi.json')

class Web3Provider {

  constructor(url, abi) {
    this.abi = abi
    this.web3 = new Web3(url)
    this.Contract = this.web3.eth.Contract
  }

  getDecimals(address) {
    const contract = new this.Contract(this.abi, address)
    return contract.methods.decimals().call()
  }

  getName(address) {
    const contract = new this.Contract(this.abi, address)
    return contract.methods.name().call()
  }

  getSymbol(address) {
    const contract = new this.Contract(this.abi, address)
    return contract.methods.symbol().call()
  }

}

const ethereum = new Web3Provider('https://mainnet.infura.io/v3/d13bc12e6f5a4d3bad8d80291c74c1d3', erc20Abi)
const optimism = new Web3Provider('https://mainnet.optimism.io', erc20Abi)
const arbitrumOne = new Web3Provider('https://arb1.arbitrum.io/rpc', erc20Abi)
const polygon = new Web3Provider('https://polygon-rpc.com', erc20Abi)
const binance = new Web3Provider('https://bsc-dataseed1.binance.org:443', erc20Abi)
const avalanche = new Web3Provider('https://rpc.ankr.com/avalanche', erc20Abi)
const cronos = new Web3Provider('https://evm.cronos.org', erc20Abi)
const fantom = new Web3Provider('https://rpc.ankr.com/fantom', erc20Abi)
const celo = new Web3Provider('https://rpc.ankr.com/celo', erc20Abi)

const getProvider = chainOrType => {
  switch (chainOrType) {
    case 'erc20':
    case 'ethereum':
      return ethereum
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
