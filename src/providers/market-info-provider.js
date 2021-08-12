const coinGeckoProvider = require('./coin-gecko-provider');

module.exports = {

  getCoinInfo: (uid, language, currency) => {
    return coinGeckoProvider.getCoinInfo(uid, language, currency)
  }

}
