const Syncer = require('./Syncer')
const CryptoSubscription = require('../providers/crypto-subscription')
const Subscription = require('../db/models/Subscription')

const web3 = new CryptoSubscription(process.env.ETH_SOCKET_URL)

class SubscriptionSyncer extends Syncer {

  async start() {
    const fromBlock = await this.getLastBlock()
    const subscribe = (subscription, eventName) => subscription
      .on('data', data => this.onData(eventName, data))
      .on('changed', data => console.log('changed', data))
      .on('connected', id => console.log('connected', id))
      .on('error', err => console.error(err))

    subscribe(web3.subscribe(fromBlock, 'SubscriptionWithPromoCode'), 'SubscriptionWithPromoCode')
    subscribe(web3.subscribe(fromBlock, 'Subscription'), 'Subscription')
  }

  async onData(eventName, { data, topics, blockNumber }) {
    try {
      const decoded = web3.decodeSubscription(data, topics.slice(1), eventName)
      const deadline = await web3.getSubscriptionDeadline(decoded.subscriber)

      console.log('Subscription received', JSON.stringify({ ...decoded, deadline, blockNumber }))

      if (deadline) {
        await Subscription.upsert({
          address: decoded.subscriber,
          expire_date: new Date(deadline * 1000),
          block_number: blockNumber
        })
      }

    } catch (e) {
      console.error(e)
    }
  }

  async getLastBlock() {
    const subscription = await Subscription.findOne({
      order: [['block_number', 'desc']]
    })

    return subscription ? subscription.block_number : 0
  }
}

module.exports = SubscriptionSyncer
