const { valueInCurrency, nullOrString } = require('../../utils')
const { serialize: serializePlatforms } = require('../top-platforms/top-chains.serializer')
const { serialize: serializeCategories } = require('../categories/categories.serializer')
const { serialize: serializeNft } = require('../nft/nft.serializer')
const { serializeTopPairs, serializeTopMarketPairs } = require('../exchange/exchange.serializer')

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

const serializeOverview = ({ global, categories, nft, platforms, pairs, marketPairs, simplified }, currencyRate) => {
  return {
    global: serializeList(global, currencyRate),
    sectors: serializeCategories(categories, currencyRate),
    platforms: serializePlatforms(platforms, currencyRate),
    nft: serializeNft(nft, simplified),
    pairs: serializeTopPairs(pairs, currencyRate),
    market_pairs: serializeTopMarketPairs(marketPairs, currencyRate),
  }
}


exports.serializeOverviewSimple = (item, currencyRate) => {
  return {
    market_cap: valueInCurrency(item.market_cap, currencyRate),
    market_cap_change: item.market_cap_change,
    defi_market_cap: valueInCurrency(item.defi_market_cap, currencyRate),
    defi_market_cap_change: item.defi_market_cap_change,
    volume: valueInCurrency(item.volume, currencyRate),
    volume_change: item.volume_change,
    btc_dominance: nullOrString(item.btc_dominance),
    btc_dominance_change: item.btc_dominance_change,
    tvl: valueInCurrency(item.tvl, currencyRate),
    tvl_change: item.tvl_change,
    etf_total_inflow: valueInCurrency(item.etf_total_inflow, currencyRate),
    etf_daily_inflow: valueInCurrency(item.etf_daily_inflow, currencyRate)
  }
}


exports.serializeList = serializeList
exports.serializeTvls = serializeTvls
exports.serializeOverview = serializeOverview
