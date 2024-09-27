const Web3 = require('web3')
const abi = require('./abi/erc20-abi.json')

class Web3EvmProvider {
  constructor(url) {
    let rpc = url
    if (rpc.includes('INFURA_API_KEY')) {
      rpc = rpc.replace(/\${INFURA_API_KEY}/, 'd13bc12e6f5a4d3bad8d80291c74c1d3')
    }

    this.abi = abi
    this.type = 'eip20'
    this.web3 = new Web3(rpc)
    this.Contract = this.web3.eth.Contract
  }

  getDecimals(address) {
    const contract = new this.Contract(abi, address)
    return contract.methods.decimals().call()
  }

  getName(address) {
    const contract = new this.Contract(abi, address)
    return contract.methods.name().call()
  }

  getSymbol(address) {
    const contract = new this.Contract(abi, address)
    return contract.methods.symbol().call()
  }
}

module.exports = Web3EvmProvider
