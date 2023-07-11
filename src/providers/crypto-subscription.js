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

    this.eventSubscriptionWithPromoCode = this.abi.find(item => item.name === 'SubscriptionWithPromoCode')
    this.eventUpdateSubscription = this.abi.find(item => item.name === 'UpdateSubscription')
    this.eventSubscription = this.abi.find(item => item.name === 'Subscription')
  }

  setBlockNumber(number) {
    this.blockNumber = number
  }

  getSubscriptionDeadline(address) {
    return this.methods.subscriptionDeadline(address).call()
  }

  async getSubscriptions() {
    return [
      ...await this.getLogs(this.eventSubscriptionWithPromoCode),
      ...await this.getLogs(this.eventUpdateSubscription),
      ...await this.getLogs(this.eventSubscription)
    ]
  }

  getLogs(event) {
    if (!event) {
      console.log('Event is required')
      return []
    }

    return this.eth.getPastLogs({ fromBlock: this.blockNumber, topics: [event.signature] })
      .then(res => res.map(item => {
        const data = this.eth.abi.decodeLog(event.inputs, item.data, item.topics.slice(1))

        return {
          name: event.name,
          address: data.subscriber || data._address,
          duration: data.duration,
          deadline: data.deadline,
          blockNumber: item.blockNumber
        }
      }))
      .catch(e => {
        console.log(e.message)
        return []
      })
  }

  async syncLatestBlock() {
    try {
      let blockNumber = await this.eth.getBlockNumber()
      if (!this.blockNumber) {
        blockNumber -= (this.chain === 'ethereum' ? 1000 : 3000)
      } else {
        blockNumber -= 100
      }

      if (!blockNumber) {
        return
      }

      console.log(`Setting new block number ${blockNumber}; chain ${this.chain}`)

      this.blockNumber = blockNumber
    } catch (e) {
      console.error(e.message)
    }
  }

}

module.exports = CryptoSubscription
