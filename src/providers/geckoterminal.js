const createAxios = require('axios')

const axios = createAxios.create({
  baseURL: 'https://api.geckoterminal.com/api/v2/networks',
  timeout: 180000,
})

exports.mapChainToNetwork = chain => {
  switch (chain) {
    case 'the-open-network':
      return 'ton'

    default:
      return null
  }
}

exports.getTokenInfo = function getTokenInfo(chain, address) {
  return axios
    .get(`/ton/tokens/${address}`)
    .then(({ data: res }) => {
      if (!res.data || !res.data.attributes) {
        return {}
      }

      return res.data.attributes
    })
    .catch(e => {
      console.log(e.message)
      return {}
    })
}
