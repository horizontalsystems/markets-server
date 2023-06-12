const Syncer = require('./Syncer')
const CryptoSubscription = require('../providers/crypto-subscription')
const Subscription = require('../db/models/Subscription')
const abi = require('../providers/abi/crypto-subscription.json')

const subscriptionEth = new CryptoSubscription('ethereum')
const subscriptionBsc = new CryptoSubscription('bsc')

class SubscriptionSyncer extends Syncer {

  async start() {
    this.cron('*/1 * * * *', this.sync)
  }

  async sync() {
    const subscriptions = await Subscription.getInactive()
    console.log('Sync subscriptions', subscriptions.length)

    for (let i = 0; i < subscriptions.length; i += 1) {
      const subscription = subscriptions[i]

      let web3
      if (subscription.chain === 'bsc') {
        web3 = subscriptionBsc
      } else if (subscription.chain === 'ethereum') {
        web3 = subscriptionEth
      } else {
        continue
      }

      await this.updateSubscription(web3, { subscriber: subscription.address })
    }
  }

  async syncEvents() {
    const events = [
      'Subscription',
      'SubscriptionWithPromoCode',
      'PromoCodeAddition',
      'UpdateSubscription'
    ]

    await this.syncSubscriptions(subscriptionEth, events, 3595469)
    await this.syncSubscriptions(subscriptionBsc, events, 29063199)
  }

  async syncSubscriptions(subscription, events, lastBlock) {
    const subscriptions = {}

    for (let i = 0; i < events.length; i += 1) {
      const data = await this.getSubscriptions(subscription.eth, lastBlock, events[i])
      console.log(data)

      data.forEach(item => {
        subscriptions[item.subscriber] = item
      })
    }

    const subscribers = Object.keys(subscriptions)

    for (let i = 0; i < subscribers.length; i += 1) {
      const item = subscribers[i]
      await this.updateSubscription(subscriptionEth, subscriptions[item])
    }
  }

  async updateSubscription(subscription, { subscriber } = {}) {
    if (!subscriber) {
      return
    }

    try {
      const deadline = parseInt(await subscription.getSubscriptionDeadline(subscriber), 10)
      console.log(`Fetched subscription ${subscriber} with deadline ${deadline}`)

      if (!deadline) {
        return
      }

      await Subscription.upsert({
        chain: subscription.chain,
        address: subscriber.toLowerCase(),
        expire_date: new Date(deadline * 1000)
      })
    } catch (e) {
      console.error(e)
    }
  }

  getSubscriptions(eth, fromBlock, eventName) {
    const event = abi.find(item => item.name === eventName)
    const topics = [
      event.signature
    ]

    return eth.getPastLogs({ fromBlock, topics }).then(
      res => res.map(item => {
        const data = eth.abi.decodeLog(event.inputs, item.data, item.topics.slice(1))
        const subs = {
          blockNumber: item.blockNumber,
          subscriber: data.subscriber || data._address,
          duration: data.duration,
          deadline: data.deadline
        }

        console.log('Got subscription', JSON.stringify(subs))

        return subs
      })
    )
  }
}

module.exports = SubscriptionSyncer
