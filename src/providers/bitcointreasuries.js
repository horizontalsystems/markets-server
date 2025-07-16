const { create } = require('axios')

const api = create({
  baseURL: 'https://bitcointreasuries.net',
  timeout: 180000,
})

exports.getCompanies = (isPrivate) => {
  return api
    .get(isPrivate ? '/private-companies' : '/')
    .then(resp => resp.data)
}
