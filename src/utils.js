const { DateTime } = require('luxon')
const fs = require('fs')
const path = require('path')

exports.sleep = (timeout = 1000) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

exports.utcDate = (format, duration = {}) => {
  return DateTime.utc()
    .plus(duration)
    .toFormat(format)
}

exports.requireFile = file => {
  return fs.readFileSync(path.resolve(__dirname, file), 'utf8')
}

exports.nullOrString = value => {
  return (value || value === 0) ? value.toString() : null
}

exports.floatToString = (value, precision = 2) => {
  return (value || value === 0) ? value.toPrecision(precision) : null
}

exports.valueInCurrency = (value, currencyRate) => {
  if (!value) {
    return null
  }

  return String(value * currencyRate)
}

exports.capitalizeFirstLetter = (string = '') => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

exports.percentageBetweenNumber = (oldNumber, newNumber) => {
  if (!oldNumber || !newNumber) {
    return null
  }

  return (1 - (oldNumber / newNumber)) * 100
}
