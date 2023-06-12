const Web3 = require('web3')
const abi = require('./abi/crypto-subscription.json')

class CryptoSubscription {
  constructor(chain) {
    if (chain === 'ethereum') {
      this.rpc = process.env.ETH_SOCKET_URL
      this.contract = process.env.ETH_SUBSCRIPTION_CONTRACT
    } else if (chain === 'bsc') {
      this.rpc = process.env.BSC_SOCKET_URL
      this.contract = process.env.BSC_SUBSCRIPTION_CONTRACT
    } else {
      throw new Error(`Invalid chain ${chain}`)
    }

    const { eth } = new Web3(this.rpc)
    const { methods } = new eth.Contract(abi, this.contract)

    this.eth = eth
    this.methods = methods
    this.chain = chain
  }

  getSubscriptionDeadline(address) {
    return this.methods.subscriptionDeadline(address).call()
  }

  subscribe(fromBlock, eventName) {
    const blockNumber = fromBlock
    console.log(`Subscribed from block ${blockNumber}`)
    const event = abi.find(item => item.name === eventName)

    const options = {
      fromBlock: blockNumber,
      address: process.env.CRYPTO_SUBSCRIPTION_CONTRACT,
      topics: [event.signature]
    }

    return this.eth.subscribe('logs', options)
  }

  decodeSubscription(hex, topics, eventName) {
    const event = abi.find(item => item.name === eventName)
    const decoded = this.eth.abi.decodeLog(event.inputs, hex, topics)

    return {
      subscriber: decoded.subscriber || decoded._address,
      promoCode: decoded.promoCode,
      duration: decoded.duration,
      paymentToken: decoded.paymentToken,
      tokenCost: decoded.tokenCost,
    }
  }
}

module.exports = CryptoSubscription
