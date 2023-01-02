const { stringify } = require('querystring')

const api = require('axios').create({
  baseURL: 'https://apilist.tronscanapi.com/api',
  timeout: 180000
})

exports.getTokenInfo = address => {
  const params = {
    contract: address,
    showAll: 1
  }

  console.log(`Fetching circulating supply for ${address} from tronscanapi.org`)

  return api.get(`/token_trc20?${stringify(params)}`)
    .then(res => (res.data || {}).trc20_tokens || [])
    .then(tokens => tokens[0])
    .catch(e => {
      console.error(e)
      return null
    })
}
