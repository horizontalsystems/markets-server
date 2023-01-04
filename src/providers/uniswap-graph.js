const axios = require('axios').create({
  baseURL: 'https://api.thegraph.com/subgraphs/name',
  timeout: 180000 * 2,
  headers: {}
})

class UniswapGraph {
  async getLiquidity(tokens, isV3 = true) {
    console.log(`Fetching dex liquidity from uniswap-${isV3 ? 'v3' : 'v2'}`)

    const liquidityField = isV3 ? 'totalValueLockedUSD' : 'totalLiquidity'
    const subgraph = isV3 ? 'uniswap-v3' : 'uniswap-v2'

    const query = {
      variables: {
        tokens: tokens.map(token => token.address)
      },
      operationName: 'tokens',
      query: `
        query tokens($tokens: [ID!]) {
          tokens(where: { id_in: $tokens }) {
            address: id
            volume: ${liquidityField}
          }
        }
      `
    }

    return axios.post(`/uniswap/${subgraph}`, query)
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

  async getLiquidityHistory(dateFrom, tokens, isV3 = true) {
    console.log(`Fetching dex liquidity history from uniswap-${isV3 ? 'v3' : 'v2'}`)

    const liquidityField = isV3 ? 'totalValueLockedUSD' : 'totalLiquidityUSD'
    const subgraph = isV3 ? 'uniswap-v3' : 'uniswap-v2'

    const build = token => `
      ${this.tokenKey(token)}: tokenDayDatas(first: 1000, skip: $skip, where: { token: "${token}", date_gt: $startTime }, orderBy: date, orderDirection: asc, subgraphError: allow) {
        date
        volume: ${liquidityField}
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

    return axios.post(`/uniswap/${subgraph}`, query)
      .then(({ data }) => data)
      .then(({ data }) => {
        if (!data) {
          return []
        }

        return this.normalizeLiquidity(tokens, data)
      })
      .catch(e => {
        console.log(e.message, e.response.data)
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

module.exports = new UniswapGraph()
