const { nullOrInteger, nullOrString } = require('../../utils')

module.exports = {
  overview: ({ cexVolumes, dexVolumes, dexLiquidity, addresses, transactions, defiProtocolData, ranks, other }) => {
    const data = {}

    if (cexVolumes.length) {
      data.cex_volume = {
        points: cexVolumes,
        rank: {
          day: nullOrInteger(ranks.cex_volume_day_rank),
          week: nullOrInteger(ranks.cex_volume_week_rank),
          month: nullOrInteger(ranks.cex_volume_month_rank)
        }
      }
    }
    if (dexVolumes.length) {
      data.dex_volume = {
        points: dexVolumes,
        rank: {
          day: nullOrInteger(ranks.dex_volume_day_rank),
          week: nullOrInteger(ranks.dex_volume_week_rank),
          month: nullOrInteger(ranks.dex_volume_month_rank)
        }
      }
    }
    if (dexLiquidity.length) {
      data.dex_liquidity = {
        points: dexLiquidity,
        rank: nullOrInteger(ranks.liquidity_rank)
      }
    }
    if (addresses.length) {
      data.addresses = {
        points: addresses,
        rank: {
          day: nullOrInteger(ranks.address_day_rank),
          week: nullOrInteger(ranks.address_week_rank),
          month: nullOrInteger(ranks.address_month_rank)
        },
        count: {
          day: nullOrInteger(ranks.address_day),
          week: nullOrInteger(ranks.address_week),
          month: nullOrInteger(ranks.address_month),
        }
      }
    }

    if (transactions.length) {
      data.transactions = {
        points: transactions,
        rank: {
          day: nullOrInteger(ranks.tx_day_count_rank),
          week: nullOrInteger(ranks.tx_week_count_rank),
          month: nullOrInteger(ranks.tx_month_count_rank)
        },
        volume: {
          day: nullOrInteger(ranks.tx_day),
          week: nullOrInteger(ranks.tx_week),
          month: nullOrInteger(ranks.tx_month)
        }
      }
    }

    if (defiProtocolData.tvls && defiProtocolData.tvls.length) {
      data.tvl = {
        points: defiProtocolData.tvls,
        rank: nullOrInteger(ranks.tvl_rank),
        ratio: nullOrString(defiProtocolData.ratio)
      }
    }

    if (ranks.revenue_day_rank || ranks.revenue_week_rank || ranks.revenue_month_rank) {
      data.revenue = {
        rank: {
          day: nullOrInteger(ranks.revenue_day_rank),
          week: nullOrInteger(ranks.revenue_week_rank),
          month: nullOrInteger(ranks.revenue_month_rank)
        }
      }
    }

    if (other.reports) {
      data.reports = other.reports
    }

    if (other.funding) {
      data.funding = other.funding
    }

    if (other.treasuries) {
      data.treasuries = other.treasuries
    }

    data.holders = {
      ethereum: 0,
      bsc: 0
    }

    return data
  }
}
