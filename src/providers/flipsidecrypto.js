const { create } = require('axios')
const { Flipside } = require('@flipsidecrypto/sdk')

const axios = create({
  baseURL: 'https://api.flipsidecrypto.com/api',
  timeout: 180000,
  headers: {}
})

exports.runQuery = async (query, key) => {
  console.log('Running a flipsidecrypto query')

  try {
    const flipside = new Flipside(key, 'https://api-v2.flipsidecrypto.xyz')
    const response = await flipside.query.run({ sql: query })
    return response.records
  } catch (e) {
    console.log(e)
    return []
  }
}

exports.getBnbActiveStats = () => {
  const mapper = item => ({
    platform: 'binance-smart-chain',
    period: item.PERIOD,
    address_count: item.ADDRESS_COUNT
  })

  return axios.get('/v2/queries/615a678a-7355-438a-8e42-7e36ab7a99fc/data/latest')
    .then(({ data }) => data.map(mapper))
    .catch(e => {
      console.log(e.message)
      return []
    })
}

exports.getMonthlyAddressStats = queryId => {
  const mapper = item => ({
    platform: item.PLATFORM,
    period: item.PERIOD,
    address_count: item.ADDRESS_COUNT
  })

  return axios.get(`/v2/queries/${queryId}/data/latest`)
    .then(({ data }) => data.map(mapper))
    .catch(e => {
      console.log(e.message)
      return []
    })
}

exports.getActiveAddresses = queryId => {
  const mapper = item => ({
    platform: item.PLATFORM,
    period: item.PERIOD,
    block_date: item.BLOCK_DATE,
    address_count: item.ADDRESS_COUNT
  })

  return axios.get(`/v2/queries/${queryId}/data/latest`)
    .then(({ data }) => data.map(mapper))
    .catch(e => {
      console.log(e.message)
      return []
    })
}

exports.getLogs = chain => {
  const queryId = chain === 'ethereum'
    ? '452a82bd-8eec-4f7a-bfb6-e4a9c1cde9d7'
    : '709154d0-20e8-4d73-b6bb-6ff7070ccc27'

  console.log('Fetching logs for', chain)

  return axios.get(`/v2/queries/${queryId}/data/latest`)
    .then(({ data }) => data)
    .catch(e => {
      console.log(e.message)
      return []
    })
}
