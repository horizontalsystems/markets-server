const { valueInCurrency } = require('../../utils')
const { serialize: serializePlatforms } = require('../top-platforms/top-chains.serializer')
const { serialize: serializeCategories } = require('../categories/categories.serializer')
const { serialize: serializeNft } = require('../nft/nft.serializer')

const serializeList = (coins, currencyRate) => {
  return coins.map(item => {
    return {
      date: item.date,
      market_cap: valueInCurrency(item.market_cap, currencyRate),
      defi_market_cap: valueInCurrency(item.defi_market_cap, currencyRate),
      volume: valueInCurrency(item.volume, currencyRate),
      btc_dominance: item.btc_dominance,
      tvl: valueInCurrency(item.tvl, currencyRate),
    }
  })
}

const serializeTvls = (tvls, currencyRate) => {
  return tvls.map(item => {
    return {
      date: item.date,
      tvl: valueInCurrency(item.tvl || '0', currencyRate),
    }
  })
}

const serializeOverview = ({ global, categories, nft, platforms }, currencyRate) => {
  return {
    global: serializeList(global, currencyRate),
    sectors: serializeCategories(categories, currencyRate),
    platforms: serializePlatforms(platforms, currencyRate),
    nft: serializeNft(nft)
  }
}

exports.serializeList = serializeList
exports.serializeTvls = serializeTvls
exports.serializeOverview = serializeOverview
