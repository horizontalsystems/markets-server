const Web3 = require('web3')
const abiEth = require('./abi/crypto-subscription-eth.json')
const abiBsc = require('./abi/crypto-subscription-bsc.json')

class CryptoSubscription {
  constructor(chain) {
    if (chain === 'ethereum') {
      this.abi = abiEth
      this.rpc = process.env.ETH_SOCKET_URL
      this.contract = process.env.ETH_SUBSCRIPTION_CONTRACT
    } else if (chain === 'bsc') {
      this.abi = abiBsc
      this.rpc = process.env.BSC_SOCKET_URL
      this.contract = process.env.BSC_SUBSCRIPTION_CONTRACT
    } else {
      throw new Error(`Invalid chain ${chain}`)
    }

    const { eth } = new Web3(this.rpc)
    const { methods } = new eth.Contract(this.abi, this.contract)

    this.eth = eth
    this.methods = methods
    this.chain = chain
  }

  getSubscriptionDeadline(address) {
    return this.methods.subscriptionDeadline(address).call()
  }
}

module.exports = CryptoSubscription
