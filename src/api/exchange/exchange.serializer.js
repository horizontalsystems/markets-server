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

exports.serializeTickers = exchanges => {
  return exchanges.map(item => {
    return {
      base: item.base,
      target: item.target,
      price: item.price,
      volume: item.volume_usd,
      market_uid: item.market_uid,
      market_name: item.market_name,
      market_logo: item.market_logo
    }
  })
}
