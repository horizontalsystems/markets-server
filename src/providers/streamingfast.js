const axios = require('axios').create({
  baseURL: 'https://bsc.streamingfast.io',
  timeout: 180000 * 2
})

class Streamingfast {
  async getPancakeLiquidity(since, platforms) {
    const tokens = platforms.map(item => item.address)
    const query = {
      variables: {
        since,
        tokens
      },
      query: `query ($tokens: [String!], $since: Int!) {
        tokenDayDatas(first: 1000, where: { token_in: $tokens, date_gte: $since, totalLiquidityUSD_gt: 0 }) {
          date
          token { id }
          volume: totalLiquidityUSD
        }
      }`
    }

    console.log('Fetching Liquidity from pancakeswap/exchange-v2')

    return axios.post('/subgraphs/name/pancakeswap/exchange-v2', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data || !data.tokenDayDatas) {
          return []
        }

        return data.tokenDayDatas
      })
      .catch(e => {
        console.log(e)
        return []
      })
  }
}

module.exports = new Streamingfast()
