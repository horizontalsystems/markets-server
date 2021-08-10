const axios = require('axios')

const instance = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 180000
});

module.exports = {
  getCoinInfo: (id) => {
    return instance.get(`/coins/${id}`).then(resp => resp.data)
  }
}
