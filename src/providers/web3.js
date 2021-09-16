const Web3 = require('web3')
const erc20Abi = require('./abi/erc20-abi')
const bep20Abi = require('./abi/bep20-abi')

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

}

const ethereum = new Web3Provider('https://mainnet.infura.io/v3/d13bc12e6f5a4d3bad8d80291c74c1d3', erc20Abi)
const binance = new Web3Provider('https://bsc-dataseed1.binance.org:443', bep20Abi)

exports.getERC20Decimals = async (contractAddress) => {
  try {
    return await ethereum.getDecimals(contractAddress)
  } catch (e) {
    console.error(e)
    return null
  }
}

exports.getBEP20Decimals = async (contractAddress) => {
  try {
    return await binance.getDecimals(contractAddress)
  } catch (e) {
    console.error(e)
    return null
  }
}
