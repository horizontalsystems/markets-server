const { nullOrString, nullOrInteger, utcDate } = require('../../utils')

const intervalToDate = function intervalToDate(interval) {
  switch (interval) {
    case '1d':
      return utcDate({ days: -2 }, null, true)
    case '1w':
      return utcDate({ days: -7 }, null, true)
    case '2w':
      return utcDate({ days: -14 }, null, true)
    case '1m':
      return utcDate({ days: -30 }, null, true)
    case '3m':
      return utcDate({ days: -90 }, null, true)
    case '6m':
    default:
      return utcDate({ days: -180 }, null, true)
  }
}

const mapChartPoints = (history, rangeInterval) => {
  if (!history) {
    return []
  }
  const from = parseInt(intervalToDate(rangeInterval), 10)
  const entries = Object.entries(history)
  const chart = []

  for (let i = 0; i < entries.length; i += 1) {
    const [timestamp, apy] = entries[i]

    if (timestamp >= from) {
      chart.push({ timestamp: nullOrInteger(timestamp), apy: nullOrString(apy) })
    }
  }

  return chart
}

module.exports = {
  intervalToDate,
  mapChartPoints
}
