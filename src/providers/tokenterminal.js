const axios = require('axios').create({
  baseURL: 'https://api.tokenterminal.com/v2',
  timeout: 180000,
  headers: { Authorization: `Bearer ${process.env.TOKEN_TERMINAL_KEY}` }
})

const {
  mapUID
} = require('./normalizers/tokenterminal-normalizer')

exports.getProjects = () => {
  return axios.get('/internal/bulky/projects-metric-aggregations')
    .then(({ data }) => data.map(item => {
      const revenue = (item.metric_aggregations || {}).revenue || {}
      return {
        uid: mapUID(item.project_id),
        revenue: revenue.sums || {}
      }
    }))
    .catch(e => {
      console.error(e)
      return []
    })
}
