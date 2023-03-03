const { nullOrInteger, nullOrString } = require('../../utils')

module.exports = {
  overview: ({ cexVolumes, dexVolumes, dexLiquidity, addresses, transactions, defiProtocolData, ranks, other }) => {
    const data = {}

    if (cexVolumes.length) {
      data.cex_volume = {
        ranks: {
          day: nullOrInteger(ranks.cex_volume_day_rank),
          week: nullOrInteger(ranks.cex_volume_week_rank),
          month: nullOrInteger(ranks.cex_volume_month_rank)
        },
        points: cexVolumes
      }
    }
    if (dexVolumes.length) {
      data.dex_volume = {
        ranks: {
          day: nullOrInteger(ranks.dex_volume_day_rank),
          week: nullOrInteger(ranks.dex_volume_week_rank),
          month: nullOrInteger(ranks.dex_volume_month_rank)
        },
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
        ranks: {
          day: nullOrInteger(ranks.address_day_rank),
          week: nullOrInteger(ranks.address_week_rank),
          month: nullOrInteger(ranks.address_month_rank)
        },
        counts: {
          day: nullOrInteger(ranks.address_day),
          week: nullOrInteger(ranks.address_week),
          month: nullOrInteger(ranks.address_month),
        },
        points: addresses
      }
    }

    if (transactions.length) {
      data.transactions = {
        ranks: {
          day: nullOrInteger(ranks.tx_day_count_rank),
          week: nullOrInteger(ranks.tx_week_count_rank),
          month: nullOrInteger(ranks.tx_month_count_rank)
        },
        volumes: {
          day: nullOrString(ranks.tx_day),
          week: nullOrString(ranks.tx_week),
          month: nullOrString(ranks.tx_month)
        },
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
        ranks: {
          day: nullOrInteger(ranks.revenue_day_rank),
          week: nullOrInteger(ranks.revenue_week_rank),
          month: nullOrInteger(ranks.revenue_month_rank)
        },
        values: {
          day: nullOrString(ranks.revenue_day),
          week: nullOrString(ranks.revenue_week),
          month: nullOrString(ranks.revenue_month)
        },
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
      { blockchain_uid: 'ethereum', count: 0 },
      { blockchain_uid: 'binance-smart-chain', count: 0 }
    ]

    return data
  }
}
