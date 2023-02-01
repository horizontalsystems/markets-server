const { get } = require('lodash')
const axios = require('axios')

class Bitquery {

  constructor(apiKey) {
    this.axios = axios.create({
      baseURL: 'https://graphql.bitquery.io',
      timeout: 180000 * 2,
      headers: { 'X-API-KEY': apiKey }
    })
  }

  getChain(network) {
    switch (network) {
      case 'bsc': // @deprecated
      case 'binance-smart-chain':
        return 'ethereum(network: bsc)'
      case 'matic': // @deprecated
      case 'polygon-pos':
        return 'ethereum(network: matic)'
      case 'avalanche':
        return 'ethereum(network: avalanche)'
      case 'bitcoin-cash':
        return 'bitcoin(network: bitcash)'
      default:
        return `${network}(network: ${network})`
    }
  }

  getAddressCoins(address, network) {
    const chain = this.getChain(network)
    const query = {
      variables: {
        address
      },
      query: `query ($address: String!) {
        res:${chain} {
          address(address: { is: $address }) {
            balances {
              value
              currency {
                address
                symbol
                tokenType
              }
            }
          }
          blocks {
            count
          }
        }
      }`
    }

    return this.axios.post('/', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        const balances = get(data, 'res.address[0].balances')
        const blockNumber = get(data, 'res.blocks[0].count')

        return {
          balances: balances || [],
          blockNumber: blockNumber || 0
        }
      })
      .catch(e => {
        console.error(e)
        return {
          balances: [],
          blockNumber: 0
        }
      })
  }

  async getBlockNumber(network) {
    const chain = this.getChain(network)
    const query = {
      query: `{
        res:${chain} {
          blocks {
            count
          }
        }
      }`
    }

    return this.axios.post('/', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        return get(data, 'res.blocks[0].count') || 0
      })
      .catch(e => {
        console.error(e)
        return 0
      })
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
    console.log(`Fetching transfers for ${network}`)

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
    console.log(`Fetching dex volumes for ${network}`)
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
            tradeAmount(calculate: sum)
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

    return this.axios.post('/', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data || !data.res || !data.res.dexTrades) {
          return []
        }

        return data.res.dexTrades
      })
      .catch(e => {
        console.error(e)
        return []
      })
  }

  fetchTransfers(query) {
    return this.axios.post('/', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data || !data.res || !data.res.transfers) {
          return []
        }

        return data.res.transfers
      })
      .catch(e => {
        console.error(e)
        return []
      })
  }
}

exports.bitquery = new Bitquery(process.env.BITQUERY_KEY)
exports.bitqueryProxy = new Bitquery(process.env.BITQUERY_KEY_PROXY)
