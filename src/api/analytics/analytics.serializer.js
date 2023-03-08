const { nullOrInteger, nullOrString } = require('../../utils')

module.exports = {
  overview: ({ cexVolumes, dexVolumes, dexLiquidity, addresses, transactions, defiProtocolData, ranks, other, holders }) => {
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

    data.holders = holders

    return data
  },

  preview: ({ cexvolumes, dexvolumes, dexliquidity, addresses, transactions, ranks, other, defiProtocol, holders }) => {
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

    data.holders = !!holders

    return data
  },

  holders: data => {
    return {
      count: nullOrString(data.count),
      top_holders: data.top_holders.map(item => {
        return {
          address: item.address,
          balance: nullOrString(item.balance),
          percentage: nullOrString(item.percentage),
        }
      })
    }
  },

  ranks: (ranks, type) => {
    const items = []
    const getRank = rank => {
      if (type === 'dex_liquidity') {
        return {
          value: rank.liquidity
        }
      }

      if (type === 'tx_count') {
        return {
          value_1d: rank.tx_day_count,
          value_7d: rank.tx_week_count,
          value_30d: rank.tx_month_count
        }
      }

      return {
        value_1d: rank[`${type}_day`],
        value_7d: rank[`${type}_week`],
        value_30d: rank[`${type}_month`]
      }
    }

    for (let i = 0; i < ranks.length; i += 1) {
      const { uid, rank } = ranks[i]
      const item = getRank(rank)
      const data = { uid }

      if (item.value_1d) data.value_1d = nullOrInteger(item.value_1d)
      if (item.value_7d) data.value_7d = nullOrInteger(item.value_7d)
      if (item.value_30d) data.value_30d = nullOrInteger(item.value_30d)
      if (item.value) data.value = nullOrInteger(item.value)

      if (item.value_1d || item.value_7d || item.value_30d || item.value) {
        items.push(data)
      }
    }

    return items
  }
}
