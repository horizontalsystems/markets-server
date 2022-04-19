const axios = require('axios')
const { normalizeUsdt, normalizeUsdc } = require('./normalizers/normalize-csupply')

function fetchUsdt() {
  return axios.get('https://app.tether.to/transparency.json')
    .then(({ data }) => normalizeUsdt(data))
    .catch(e => {
      console.log(e)
      return {}
    })
}

function fetchUsdc() {
  return axios.get('https://api.circle.com/v1/stablecoins')
    .then(({ data }) => normalizeUsdc(data))
    .catch(e => {
      console.log(e)
      return {}
    })
}

const getCSupplies = async () => {
  return {
    tether: await fetchUsdt(),
    'usd-coin': await fetchUsdc()
  }
}

module.exports = getCSupplies
