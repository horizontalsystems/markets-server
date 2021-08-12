const axios = require('axios')

const instance = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 180000
});

module.exports = {
  getCoinInfo: (id) => {
    return instance.get(`/coins/${id}?tickers=false&community_data=false&developer_data=false&sparkline=false`).then(resp => resp.data)
  }
}
