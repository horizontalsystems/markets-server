const { nullOrString } = require('../../utils')

const mapPlatformToChain = platform => {
  switch (platform) {
    case 'erc20':
      return 'ethereum'
    case 'bep20':
      return 'binance-smart-chain'
    default:
      return platform
  }
}

const mapChainToPlatform = platform => {
  switch (platform) {
    case 'ethereum':
      return 'erc20'
    case 'binance-smart-chain':
      return 'bep20'
    default:
      return platform
  }
}

module.exports = {

  serialize: items => {
    return items.map(item => {
      const stats = item.stats || {}

      return {
        name: mapPlatformToChain(item.name),
        market_cap: nullOrString(item.market_cap),
        rank: nullOrString(item.rank),
        stats: {
          rank_1d: nullOrString(stats.rank_1d),
          rank_1w: nullOrString(stats.rank_1w),
          rank_1m: nullOrString(stats.rank_1m),
          change_1d: nullOrString(stats.change_1d),
          change_1m: nullOrString(stats.change_1m),
          change_1w: nullOrString(stats.change_1w),
          protocols: nullOrString(stats.protocols)
        },
      }
    })
  },

  serializePlatforms: items => {
    return items.map(item => {
      return {
        uid: item.uid,
        market_cap: nullOrString(item.mcap)
      }
    })
  },

  mapPlatformToChain,
  mapChainToPlatform

}
