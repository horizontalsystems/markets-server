const coingeckoProvider = require('./coingecko-provider')

module.exports = {

  getCoinInfo: (uid, language, currency) => {
    return coingeckoProvider.getCoinInfo(uid, language, currency)
  }

}
