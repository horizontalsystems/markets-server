const querystring = require('querystring')
const createAxios = require('axios').create

const axios = createAxios({
  baseURL: 'https://api.chainbroker.io/api/v1',
  timeout: 180000
})

exports.getUnlocks = (page) => {
  console.log('Fetching token unlocks', { page })

  const params = querystring.stringify({
    volume_24h__gte: 100000,
    page
  })

  return axios
    .get(`/unlocks/list/?${params}`)
    .then(({ data: resp }) => {
      return resp.data.list
    })
}
