const { nullOrString, valueInCurrency } = require('../../utils')

exports.serializeIndex = (items, currencyRate) => {
  return items.map(item => {
    const { changes = {} } = item

    return {
      ticker: item.ticker,
      name: item.name,
      date: item.date,
      total_assets: valueInCurrency(item.totalAssets, currencyRate),
      total_inflow: valueInCurrency(item.totalInflow, currencyRate),
      inflow_1d: valueInCurrency(item.dailyInflow, currencyRate),
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

exports.serializeChart = (items, currencyRate) => {
  return items.filter(i => i.total_daily_inflow).map(item => {
    return {
      date: item.date,
      total_assets: valueInCurrency(item.total_assets, currencyRate),
      total_inflow: valueInCurrency(item.total_inflow, currencyRate),
      daily_inflow: valueInCurrency(item.total_daily_inflow, currencyRate)
    }
  })
}

exports.serializeTreasuries = items => {
  return items.map(item => {
    return {
      uid: item.uid,
      name: nullOrString(item.name),
      code: nullOrString(item.code),
      amount: nullOrString(item.amount),
      country: nullOrString(item.country),
      coin_uid: nullOrString(item.coin_uid),
      type: nullOrString(item.type)
    }
  })
}
