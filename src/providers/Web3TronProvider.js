const TronWeb = require('tronweb')

const abi = require('./abi/trc20-abi.json')

class Web3TronProvider {
  constructor(url) {
    this.tronWeb = new TronWeb({
      fullHost: url,
      headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY }
    })
    this.tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')
  }

  async getDecimals(address) {
    const instance = await this.tronWeb.contract(abi, address)
    return instance.decimals().call()
  }

  async getName(address) {
    const contract = await this.tronWeb.contract(abi, address)
    return contract.methods.name().call()
  }

  async getSymbol(address) {
    const contract = await this.tronWeb.contract(abi, address)
    return contract.methods.symbol().call()
  }
}

module.exports = Web3TronProvider
