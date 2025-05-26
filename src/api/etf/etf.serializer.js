const { nullOrString } = require('../../utils')

exports.serializeIndex = (items) => {
  return items.map(item => {
    const { changes = {} } = item

    return {
      ticker: item.ticker,
      name: item.name,
      date: item.date,
      total_assets: nullOrString(item.totalAssets),
      total_inflow: nullOrString(item.totalInflow),
      inflow_1d: nullOrString(item.dailyInflow),
      inflow_1w: nullOrString(changes['1w_inflow']),
      inflow_1m: nullOrString(changes['1m_inflow']),
      inflow_3m: nullOrString(changes['3m_inflow'])
    }
  })
}

exports.serializeTotal = items => {
  return items.filter(i => i.totalDailyInflow).map(item => {
    return {
      date: item.date,
      total_assets: nullOrString(item.totalAssets),
      total_inflow: nullOrString(item.totalInflow),
      daily_inflow: nullOrString(item.totalDailyInflow)
    }
  })
}
