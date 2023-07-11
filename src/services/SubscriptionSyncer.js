const Syncer = require('./Syncer')
const CryptoSubscription = require('../providers/crypto-subscription')
const Subscription = require('../db/models/Subscription')
const flipsidecrypto = require('../providers/flipsidecrypto')

const subscriptionEth = new CryptoSubscription('ethereum')
const subscriptionBsc = new CryptoSubscription('bsc')

class SubscriptionSyncer extends Syncer {

  async start() {
    this.cron('*/5 * * * *', this.syncLatest)
    this.cron('*/1 * * * *', this.syncInactive)
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

  async syncLatest() {
    try {
      await this.sync(subscriptionBsc)
      await this.sync(subscriptionEth)
    } catch (e) {
      console.log(e)
    }
  }

  async sync(web3) {
    await web3.syncLatestBlock()

    const subscriptionsMap = {}
    const subscriptions = await web3.getSubscriptions()
    const dateNow = new Date()

    for (let i = 0; i < subscriptions.length; i += 1) {
      const subscription = subscriptions[i]
      const isSubscribed = subscription.name !== 'UpdateSubscription'
      const subscriptionDate = new Date(subscription.deadline * 1000)

      if (!subscription.deadline || !subscriptionDate) {
        continue
      }

      if (web3.blockNumber < subscription.blockNumber) {
        web3.setBlockNumber(subscription.blockNumber)
      }

      if (isSubscribed) {
        if (dateNow > subscriptionDate) {
          continue
        }

        const record = await Subscription.findOne({ where: { address: subscription.address } })
        if (record && record.expire_date > subscriptionDate) {
          continue
        }
      }

      subscriptionsMap[subscription.address] = subscription
    }

    const newSubscribers = Object.keys(subscriptionsMap)

    for (let i = 0; i < newSubscribers.length; i += 1) {
      const subscriber = newSubscribers[i];
      await this.updateSubscription(web3, { subscriber })
    }

    if (!newSubscribers.length) {
      await web3.syncLatestBlock()
    }
  }

  async syncInactive() {
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

      const record = {
        chain: web3.chain,
        address: subscriber.toLowerCase(),
        expire_date: new Date(deadline * 1000)
      }

      await Subscription.bulkCreate([record], { updateOnDuplicate: ['expire_date'] })
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
