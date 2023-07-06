const Syncer = require('./Syncer')
const CryptoSubscription = require('../providers/crypto-subscription')
const Subscription = require('../db/models/Subscription')
const flipsidecrypto = require('../providers/flipsidecrypto')

const subscriptionEth = new CryptoSubscription('ethereum')
const subscriptionBsc = new CryptoSubscription('bsc')

class SubscriptionSyncer extends Syncer {

  async start() {
    this.cron('*/1 * * * *', this.sync)
    this.cron('2h', this.syncHistorical)
  }

  async syncHistorical() {
    try {
      await this.syncFromApi(subscriptionBsc)
      await this.syncFromApi(subscriptionEth)
    } catch (e) {
      console.log(e)
    }
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

  async syncFromApi(web3) {
    const allLogs = await flipsidecrypto.getLogs(web3.chain)
    const logsMap = await this.decodeLogHistory(web3, allLogs)
    const records = Object.keys(logsMap).map(item => {
      return {
        chain: web3.chain,
        address: item.toLowerCase()
      }
    })

    console.log('Fetched logs', allLogs.length)

    if (!records.length) {
      return
    }

    await Subscription.bulkCreate(records, { ignoreDuplicates: true })
      .then(res => {
        console.log(`Updated ${res.length} subscriptions`)
      })
      .catch(err => {
        console.log(err)
      })
  }

  async decodeLogHistory(web3, allLogs) {
    const events = web3.abi.reduce((map, item) => {
      map[item.signature] = {
        name: item.name,
        inputs: item.inputs
      }
      return map
    }, {})

    const subscriptions = {}

    for (let i = 0; i < allLogs.length; i += 1) {
      const log = allLogs[i]
      const event = events[log.TOPICS[0]]

      const data = web3.eth.abi.decodeLog(event.inputs, log.DATA, log.TOPICS.slice(1))

      if (event.name === 'PromoCodeAddition' || event.name === 'UpdateSubscription') {
        subscriptions[data._address] = data.deadline
      }

      if (event.name === 'SubscriptionWithPromoCode' || event.name === 'Subscription') {
        subscriptions[data.subscriber] = data.deadline
      }
    }

    return subscriptions
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
      const data = await this.getSubscriptions(subscription, lastBlock, events[i])

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

  async updateSubscription(web3, { subscriber } = {}) {
    if (!subscriber) {
      return
    }

    try {
      const deadline = parseInt(await web3.getSubscriptionDeadline(subscriber), 10)
      console.log(`Fetched subscription ${subscriber} with deadline ${deadline}`)

      if (!deadline) {
        return
      }

      await Subscription.upsert({
        chain: web3.chain,
        address: subscriber.toLowerCase(),
        expire_date: new Date(deadline * 1000)
      })
    } catch (e) {
      console.error(e)
    }
  }

  getSubscriptions(web3, fromBlock, eventName) {
    const event = web3.abi.find(item => item.name === eventName)
    const topics = [
      event.signature
    ]

    return web3.eth.getPastLogs({ fromBlock, topics }).then(
      res => res.map(item => {
        const data = web3.eth.abi.decodeLog(event.inputs, item.data, item.topics.slice(1))
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
