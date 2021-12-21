const axios = require('axios').create({
  baseURL: 'https://graphql.bitquery.io',
  timeout: 180000
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

    return axios.post('/', query, { headers: { 'X-API-KEY': process.env.BITQUERY_KEY } })
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
