const { create } = require('axios')

const api = create({ baseURL: 'https://chainid.network', timeout: 180000 })

exports.getChains = () => {
  return api.get('/chains.json')
    .then(res => res.data)
    .catch(e => {
      console.error(e)
      return []
    })
}
