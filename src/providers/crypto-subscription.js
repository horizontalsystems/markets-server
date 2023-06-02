const Web3 = require('web3')
const abi = require('./abi/crypto-subscription.json')

class CryptoSubscription {
  constructor(rpc, fromBlock) {
    const { eth } = new Web3(rpc)
    const { methods } = new eth.Contract(abi, process.env.CRYPTO_SUBSCRIPTION_CONTRACT)

    this.fromBlock = fromBlock
    this.eth = eth
    this.methods = methods
  }

  getSubscriptionDeadline(address) {
    return this.methods.subscriptionDeadline(address).call()
  }

  subscribe(fromBlock, eventName) {
    const blockNumber = fromBlock || this.fromBlock
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
