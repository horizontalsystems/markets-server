const axios = require('axios')
const querystring = require('querystring')
const { scanURL } = require('../utils')

const api = axios.create({
  baseURL: scanURL('solana') || 'https://api-v2.solscan.io/v2',
  timeout: 180000,
  headers: {
    'Sec-Fetch-Site': 'same-site',
    'Sol-Aut': 'k=v8mClB9dls02fKVBRL1-5EinJJBM=vPuEkmp5zZ',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Origin: 'https://solscan.io',
    Priority: 'u=1, i',
    Referer: 'https://solscan.io/',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': 'macOS',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
  }
})

exports.getHolders = address => {
  const query = querystring.stringify({
    address,
    page_size: 10,
    page: 1
  })

  return api.get(`/token/holders?${query}`).then(({ data }) => data.data)
}

exports.getTokenInfo = address => {
  return api.get(`/account?address=${address}`).then(({ data }) => {
    const info = (data.data || {}).tokenInfo
    const tokens = (data.metadata || {}).tokens || {}
    const token = tokens[address] || {}

    return {
      supply: info.supply,
      decimals: info.decimals,
      holders: token.holder
    }
  })
}
