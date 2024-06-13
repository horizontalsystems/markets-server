const createAxios = require('axios').create

const axios = createAxios({
  baseURL: 'https://api.cryptorank.io/v0',
  timeout: 180000
})

exports.getUnlocks = (skip = 0, limit = 100) => {
  console.log('Fetching token unlocks', { skip, limit })
  return axios
    .post('/consolidated-vesting', { skip, limit, enableSmallUnlocks: true })
    .then(({ data: resp }) => {
      return resp.data
    })
}
