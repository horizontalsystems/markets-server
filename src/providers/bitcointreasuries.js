const { create } = require('axios')

const api = create({
  baseURL: 'https://bitcointreasuries.net',
  timeout: 180000,
})

exports.getCompanies = (type) => {
  return api
    .get(type === 'public-companies' ? '/' : type)
    .then(resp => resp.data)
}
