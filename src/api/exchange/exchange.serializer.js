const { valueInCurrency, nullOrString } = require('../../utils')

const getImageURL = path => {
  if (path.startsWith('http')) {
    return path
  }

  return `https://assets.coingecko.com/markets/images${path}`
}

exports.serialize = exchanges => {
  return exchanges.map(item => {
    return {
      uid: item.uid,
      name: item.name
    }
  })
}

exports.serializeWhitelist = exchanges => {
  return exchanges.map(item => item.uid)
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

exports.serializeTickers = (exchanges, whitelist) => {
  return exchanges.map(item => {
    return {
      base: item.base,
      target: item.target,
      price: item.price,
      volume: item.volume,
      volume_usd: item.volume_usd,
      market_uid: item.market_uid,
      market_name: item.market_name,
      market_logo: getImageURL(item.market_logo),
      trade_url: item.trade_url,
      whitelisted: !!whitelist[item.market_uid]
    }
  })
}
