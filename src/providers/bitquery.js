const axios = require('axios').create({
  baseURL: 'https://graphql.bitquery.io',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.BITQUERY_KEY }
})

class Bitquery {
  async getTransfers(dateFrom, platforms, network) {
    let chain
    switch (network) {
      case 'bsc':
        chain = 'ethereum(network: bsc)'
        break
      default:
        chain = `${network}(network: ${network})`
    }

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

  async getDexVolumes(dateFrom, platforms, network, exchange, interval) {
    let chain
    switch (network) {
      case 'bsc':
        chain = 'ethereum(network: bsc)'
        break
      default:
        chain = `${network}(network: ${network})`
    }

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
}

module.exports = new Bitquery()
