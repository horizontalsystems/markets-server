const axios = require('axios').create({
  baseURL: 'https://proxy-worker.pancake-swap.workers.dev',
  timeout: 180000 * 2,
  headers: {}
})

class PancakeGraph {
  async getLiquidity(tokens) {
    const query = {
      variables: {
        tokens: tokens.map(token => token.address)
      },
      operationName: 'tokens',
      query: `
        query tokens($tokens: [ID!]) {
          tokens(where: { id_in: $tokens }) {
            address: id
            volume: totalLiquidity
            # tradeVolumeUSD
            # totalTransactions
          }
        }
      `
    }

    return axios.post('/bsc-exchange', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data || !data.tokens) {
          return []
        }

        return data.tokens
      })
      .catch(e => {
        console.log(e.message, e.response.data)
        return []
      })
  }

  async getLiquidityHistory(dateFrom, tokens) {
    const build = token => `
      ${this.tokenKey(token)}: tokenDayDatas(first: 1000, skip: $skip, where: { token: "${token}", date_gt: $startTime }, orderBy: date, orderDirection: asc) {
        date
        volume: totalLiquidityUSD
        # dailyVolumeUSD
      }
    `

    const queries = tokens.map(token => build(token.address)).join('')
    const query = {
      variables: {
        skip: 0,
        startTime: dateFrom
      },
      query: `query tokenDayDatas($startTime: Int!, $skip: Int!) { ${queries} }`
    }

    return axios.post('/bsc-exchange', query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data) {
          return []
        }

        return this.normalizeLiquidity(tokens, data)
      })
      .catch(e => {
        console.log(JSON.stringify(e.response.data))
        return []
      })
  }

  normalizeLiquidity(tokens, data) {
    return tokens.flatMap(token => {
      const datum = data[this.tokenKey(token.address)]
      return datum ? datum.map(item => ({ ...item, address: token.address })) : null
    })
  }

  tokenKey(token) {
    return token.slice(1, token.length)
  }
}

module.exports = new PancakeGraph()
