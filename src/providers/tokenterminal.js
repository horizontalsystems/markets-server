const axios = require('axios').create({
  baseURL: 'https://api.tokenterminal.com/v1',
  timeout: 180000,
  headers: { Authorization: `Bearer ${process.env.TOKEN_TERMINAL_KEY}` }
})

const {
  mapUID
} = require('./normalizers/tokenterminal-normalizer')

exports.getProjects = () => {
  return axios.get('/projects?interval=daily')
    .then(({ data }) => data.map(item => {
      return [
        mapUID(item.project_id),
        item.revenue_30d
      ]
    }))
    .catch(e => {
      console.log(e)
      return []
    })
}
