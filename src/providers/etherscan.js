const { create } = require('axios')
const { stringify } = require('querystring')

const web = create({ baseURL: process.env.ETHERSCAN_API || 'https://etherscan.io', timeout: 180000 })
const api = create({ baseURL: 'https://api.etherscan.io/api', timeout: 180000 })

exports.getHolders = address => {
  return web.get(`/token/tokenholderchart/${address}?range=10`).then(res => res.data)
}

exports.getAccounts = () => {
  return web.get('/accounts').then(res => res.data)
}

exports.getTokenSupply = address => {
  const params = {
    module: 'stats',
    action: 'tokensupply',
    contractaddress: address,
    apikey: process.env.ETHERSCAN_KEY
  }

  console.log(`Fetching circulating supply for ${address} from etherscan`)

  return api.get(`?${stringify(params)}`)
    .then(res => res.data)
    .then(res => (res || {}).result)
    .catch(e => {
      console.log(e)
      return 0
    })
}
