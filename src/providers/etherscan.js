const { create } = require('axios')
const { stringify } = require('querystring')
const { scanURL } = require('../utils')

const web = create({ baseURL: scanURL('ethereum') || 'https://etherscan.io', timeout: 180000 })
const api = create({ baseURL: scanURL('ethereum') || 'https://api.etherscan.io/api', timeout: 180000 })

exports.getHolders = address => {
  return web.get(`/token/tokenholderchart/${address}?range=10`).then(res => res.data)
}

exports.getAccounts = () => {
  return web.get('/accounts').then(res => res.data)
}

exports.getUniqueAddress = () => {
  return web.get('/chart/address?output=csv', { responseType: 'blob' }).then(res => res.data)
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
      console.error(e)
      return 0
    })
}
