const { get } = require('lodash')
const { create } = require('axios')

const axios = create({
  baseURL: 'https://query1.finance.yahoo.com/v8/finance',
  timeout: 180000 * 3,
})

exports.getPriceBySymbol = (symbol) => {
  return axios
    .get(`/chart/${symbol}`)
    .then(resp => get(resp.data, 'chart.result[0].meta.regularMarketPrice') || null)
}

exports.getPriceByRange = (symbol, periodFrom, periodTo) => {
  return axios
    .get(`/chart/${symbol}?period1=${periodFrom}&period2=${periodTo}&interval=1d`)
    .then(resp => {
      const marketPrice = get(resp.data, 'chart.result[0].meta.regularMarketPrice')
      const timestamps = get(resp.data, 'chart.result[0].timestamp') || []
      const prices = get(resp.data, 'chart.result[0].indicators.quote[0].close') || []

      return { prices, timestamps, price: marketPrice }
    })
}
