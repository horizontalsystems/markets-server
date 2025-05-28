const { valueInCurrency, nullOrString } = require('../../utils')

const getImageURL = path => {
  if (path.startsWith('http')) {
    if (path.startsWith('https://coin-images')) {
      return path.replace('coin-images', 'assets')
    }

    return path
  }

  return `https://assets.coingecko.com/markets/images${path}`
}

exports.serialize = verifiedExchanges => {
  return verifiedExchanges.map(item => {
    return {
      uid: item.uid,
      name: item.name
    }
  })
}

exports.serializeWhitelist = verifiedExchanges => {
  return verifiedExchanges.map(item => item.uid)
}

exports.serializeTopPairs = (markets, currencyRate) => {
  return markets.map((item, index) => {
    return {
      rank: index + 1,
      base: item.base,
      target: item.target,
      price: nullOrString(item.price),
      volume: valueInCurrency(item.volume_usd, currencyRate),
      market_name: item.market_name,
      market_logo: getImageURL(item.market_logo),
      trade_url: item.trade_url
    }
  })
}

exports.serializeTopMarketPairs = (markets, currencyRate) => {
  return markets.map((item, index) => {
    return {
      rank: index + 1,
      base: item.base,
      base_uid: item.base_uid,
      target: item.target,
      target_uid: item.target_uid,
      price: nullOrString(item.price),
      volume: valueInCurrency(item.volume_usd, currencyRate),
      market_name: item.market_name,
      market_logo: getImageURL(item.market_logo),
      trade_url: item.trade_url
    }
  })
}

exports.serializeTickers = (tickers, whitelistMap, centralizedMap, currencyRate) => {
  return tickers.map(item => {
    return {
      base: item.base,
      target: item.target,
      volume: item.volume,
      price: item.price, // @deprecated
      volume_usd: item.volume_usd, // @deprecated
      volume_in_currency: valueInCurrency(item.volume_usd, currencyRate),
      market_uid: item.market_uid,
      market_name: item.market_name,
      market_logo: getImageURL(item.market_logo),
      trade_url: item.trade_url,
      whitelisted: !!whitelistMap[item.market_uid],
      centralized: centralizedMap[item.market_uid] === true
    }
  })
}
