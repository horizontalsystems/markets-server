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
      const price = get(resp.data, 'chart.result[0].meta.regularMarketPrice')
      const timestamps = get(resp.data, 'chart.result[0].timestamp') || []
      const closePrice = get(resp.data, 'chart.result[0].indicators.quote[0].close') || []
      const prices = []

      for (let i = 0; i < timestamps.length; i += 1) {
        const timestamp = timestamps[i]
        const price = closePrice[i]

        if (timestamp && price) {
          prices.push({
            timestamp,
            price
          })
        }
      }

      return { price, prices }
    })
}
