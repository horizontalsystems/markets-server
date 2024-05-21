const { nullOrString } = require('../../utils')

exports.serializeIndex = (items) => {
  return items.map(item => {
    const { changes = {} } = item

    return {
      ticker: item.ticker,
      name: item.name,
      date: item.date,
      total_assets: nullOrString(item.totalAssets),
      daily_assets: nullOrString(changes['1d_assets']),
      total_inflow: nullOrString(item.totalInflow),
      daily_inflow: nullOrString(item.dailyInflow),
      changes: {
        '1w_assets': nullOrString(changes['1w_assets']),
        '1w_inflow': nullOrString(changes['1w_inflow']),
        '1m_assets': nullOrString(changes['1m_assets']),
        '1m_inflow': nullOrString(changes['1m_inflow']),
        '3m_assets': nullOrString(changes['3m_assets']),
        '3m_inflow': nullOrString(changes['3m_inflow'])
      }
    }
  })
}

exports.serializeTotal = items => {
  return items.map(item => {
    return {
      date: item.date,
      total_assets: nullOrString(item.totalAssets),
      total_inflow: nullOrString(item.totalInflow),
      daily_inflow: nullOrString(item.totalDailyInflow)
    }
  })
}
