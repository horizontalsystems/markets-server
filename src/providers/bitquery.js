const axios = require('axios').create({
  baseURL: 'https://graphql.bitquery.io',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.BITQUERY_KEY }
})

class Bitquery {

  getChain(network) {
    switch (network) {
      case 'bsc':
        return 'ethereum(network: bsc)'
      default:
        return `${network}(network: ${network})`
    }
  }

  async getTransferSenders(dateFrom, dateTo, platforms, network) {
    const chain = this.getChain(network)
    const query = {
      variables: {
        since: dateFrom,
        till: dateTo,
        tokens: platforms.map(item => item.address)
      },
      query: `query ($since: ISO8601DateTime!, $till: ISO8601DateTime!, $tokens: [String!]) {
        res:${chain} {
          transfers(time: { since: $since, till: $till }, currency: { in: $tokens }, options: {limit: 10000}) {
            account: sender {
              address
            }
            currency {
              address
            }
          }
        }
      }`
    }

    return this.fetchTransfers(query)
  }

  async getTransferReceivers(dateFrom, dateTo, platforms, network) {
    const chain = this.getChain(network)
    const query = {
      variables: {
        since: dateFrom,
        till: dateTo,
        tokens: platforms.map(item => item.address)
      },
      query: `query ($since: ISO8601DateTime!, $till: ISO8601DateTime!, $tokens: [String!]) {
        res:${chain} {
          transfers(time: { since: $since, till: $till }, currency: { in: $tokens }, options: {limit: 10000}) {
            account: receiver {
              address
            }
            currency {
              address
            }
          }
        }
      }`
    }

    return this.fetchTransfers(query)
  }

  async getTransfers(dateFrom, platforms, network) {
    const chain = this.getChain(network)
    const query = {
      variables: {
        since: dateFrom,
        tokens: platforms.map(item => item.address)
      },
      query: `query ($since: ISO8601DateTime!, $tokens: [String!]) {
        res:${chain} {
          transfers(date: { since: $since }, currency: { in: $tokens }) {
            count
            amount(calculate: sum)
            date {
              startOfInterval(unit: day)
            }
            currency {
              address
            }
          }
        }
      }`
    }

    return this.fetchTransfers(query)
  }

  async getDexVolumes(dateFrom, platforms, network, exchange, interval) {
    const chain = this.getChain(network)

    const query = {
      variables: {
        exchange,
        since: dateFrom,
        tokens: platforms.map(item => item.address)
      },
      query: `query ($since: ISO8601DateTime!, $tokens: [String!], $exchange: [String!]) {
        res:${chain} {
          dexTrades(
            date: { since: $since }
            baseCurrency: { in: $tokens }
            exchangeName: { in: $exchange }
          ) {
            tradeAmount(calculate: sum, in: USD)
            baseCurrency {
              address
            }
            date: timeInterval {
              value: ${interval}(count: 1)
            }
          }
        }
      }`
    }

    return axios.post('/', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data || !data.res || !data.res.dexTrades) {
          return []
        }

        return data.res.dexTrades
      })
      .catch(e => {
        console.log(e)
        return []
      })
  }

  fetchTransfers(query) {
    return axios.post('/', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data || !data.res || !data.res.transfers) {
          return []
        }

        return data.res.transfers
      })
      .catch(e => {
        console.log(e)
        return []
      })
  }
}

module.exports = new Bitquery()
