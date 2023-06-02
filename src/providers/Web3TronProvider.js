const Web3 = require('web3')
const bs58 = require('bs58')
const abi = require('./abi/trc20-abi.json')

class Web3TronProvider {
  constructor(url) {
    this.abi = abi
    this.web3 = new Web3(url)
    this.Contract = this.web3.eth.Contract
  }

  getDecimals(address) {
    const contract = new this.Contract(abi, this.convertAddress(address))
    return contract.methods.decimals().call()
  }

  getName(address) {
    const contract = new this.Contract(abi, this.convertAddress(address))
    return contract.methods.name().call()
  }

  getSymbol(address) {
    const contract = new this.Contract(abi, this.convertAddress(address))
    return contract.methods.symbol().call()
  }

  convertAddress(addressBase58) {
    const addressDecoded = bs58.decode(addressBase58)
    const addressBytes = addressDecoded.subarray(1, addressDecoded.length - 4)

    return Web3.utils.toHex(Buffer.from(addressBytes))
  }
}

module.exports = Web3TronProvider
