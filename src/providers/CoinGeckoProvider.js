const axios = require('axios')

class CoinGeckoProvider {

  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3'
    this.responsetimeout = 180000
    axios.defaults.timeout = 180000;
  }

  async getCoinInfo(id) {
    const { data: resp } = await axios.get(
      `${this.baseUrl}/coins/${id}`,
      { timeout: this.responsetimeout }
    )

    return resp
  }

}

module.exports = CoinGeckoProvider
