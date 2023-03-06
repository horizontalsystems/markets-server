const { nullOrInteger, nullOrString } = require('../../utils')

module.exports = {
  overview: ({ cexVolumes, dexVolumes, dexLiquidity, addresses, transactions, defiProtocolData, ranks, other }) => {
    const data = {}

    if (cexVolumes.length) {
      data.cex_volume = {
        rank_30d: nullOrInteger(ranks.cex_volume_month_rank),
        points: cexVolumes
      }
    }
    if (dexVolumes.length) {
      data.dex_volume = {
        rank_30d: nullOrInteger(ranks.dex_volume_month_rank),
        points: dexVolumes
      }
    }
    if (dexLiquidity.length) {
      data.dex_liquidity = {
        rank: nullOrInteger(ranks.liquidity_rank),
        points: dexLiquidity
      }
    }
    if (addresses.length) {
      data.addresses = {
        rank_30d: nullOrInteger(ranks.address_month_rank),
        count_30d: nullOrInteger(ranks.address_month),
        points: addresses
      }
    }

    if (transactions.length) {
      data.transactions = {
        rank_30d: nullOrInteger(ranks.tx_month_rank),
        volume_30d: nullOrString(ranks.tx_month),
        points: transactions
      }
    }

    if (defiProtocolData.tvls && defiProtocolData.tvls.length) {
      data.tvl = {
        rank: nullOrInteger(ranks.tvl_rank),
        ratio: nullOrString(defiProtocolData.ratio),
        points: defiProtocolData.tvls
      }
    }

    if (ranks.revenue_day_rank || ranks.revenue_week_rank || ranks.revenue_month_rank) {
      data.revenue = {
        rank_30d: nullOrInteger(ranks.revenue_month_rank),
        value_30d: nullOrString(ranks.revenue_month)
      }
    }

    if (other.reports) {
      data.reports = nullOrInteger(other.reports)
    }

    if (other.funds_invested) {
      data.funds_invested = nullOrString(other.funds_invested)
    }

    if (other.treasuries) {
      data.treasuries = nullOrString(other.treasuries)
    }

    data.holders = [
      { blockchain_uid: 'ethereum', holders_count: '900' },
      { blockchain_uid: 'binance-smart-chain', holders_count: '273' }
    ]

    return data
  },

  preview: ({ cexvolumes, dexvolumes, dexliquidity, addresses, transactions, ranks, other, defiProtocol }) => {
    const data = {}

    if (cexvolumes) {
      data.cex_volume = {
        rank_30d: !!ranks.cex_volume_month_rank,
        points: true
      }
    }

    if (dexvolumes) {
      data.dex_volume = {
        rank_30d: !!ranks.dex_volume_month_rank,
        points: true
      }
    }

    if (dexliquidity) {
      data.dex_liquidity = {
        rank: !!ranks.liquidity_rank,
        points: true
      }
    }

    if (addresses) {
      data.addresses = {
        rank_30d: !!ranks.address_month_rank,
        count_30d: !!ranks.address_month,
        points: true
      }
    }

    if (transactions) {
      data.transactions = {
        rank_30d: !!ranks.tx_month_count_rank,
        volume_30d: !!ranks.tx_month,
        points: true
      }
    }

    if (defiProtocol) {
      data.tvl = {
        rank: !!defiProtocol.tvl_rank,
        ratio: true,
        points: true
      }
    }

    if (ranks.revenue_month_rank) {
      data.revenue = {
        rank_30d: !!ranks.revenue_month_rank,
        value_30d: !!ranks.revenue_month
      }
    }

    data.reports = !!other.reports
    data.funds_invested = !!other.funds_invested
    data.treasuries = !!other.treasuries

    data.holders = true

    return data
  },

  holders: () => {
    return {
      count: '371380',
      holders: [{
        address: '0x123',
        percentage: '12.38',
        balance: '29393.1'
      }]
    }
  }
}
