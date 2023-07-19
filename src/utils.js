const { DateTime } = require('luxon')
const fs = require('fs')
const path = require('path')

exports.sleep = (timeout = 1000) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

exports.utcDate = (duration = {}, format = 'yyyy-MM-dd HH:mm:00Z', inSeconds = false) => {
  const dateTime = DateTime.utc().plus(duration)

  return inSeconds ? dateTime.toSeconds() : dateTime.toFormat(format)
}

exports.utcStartOfDay = (duration = {}, inSeconds = false) => {
  const dateTime = DateTime.utc()
    .plus(duration)
    .startOf('day')

  return inSeconds ? dateTime.toSeconds() : dateTime.toFormat('yyyy-MM-dd')
}

exports.requireFile = file => {
  return fs.readFileSync(path.resolve(__dirname, file), 'utf8')
}

exports.nullOrString = value => {
  return (value || value === 0 || value === 0.0) ? value.toString() : null
}

exports.nullOrInteger = value => {
  return parseInt(value, 10)
}

exports.floatToString = (value, precision = 2) => {
  return (value || value === 0.0) ? value.toPrecision(precision) : null
}

exports.valueInCurrency = (value, currencyRate) => {
  if (value || value === 0 || value === 0.0) {
    return String(value * currencyRate)
  }

  return null
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

exports.percentageChange = (oldNumber, newNumber) => {
  if (!oldNumber || !newNumber) {
    return null
  }

  return -((oldNumber - newNumber) / oldNumber) * 100
}

exports.reduceMap = (items, keyField, valField) => {
  return items.reduce((res, item) => {
    const key = item[keyField]
    if (!key) {
      return res
    }

    return {
      ...res,
      [key]: valField ? item[valField] : key
    }
  }, {})
}

exports.stringToHex = str => {
  let result = ''
  for (let i = 0; i < str.length; i += 1) {
    result += str.charCodeAt(i).toString(16)
  }

  return `0x${result}`
}

exports.scanURL = chain => (
  process.env.SCAN_URL ? `${process.env.SCAN_URL}/${chain}` : null
)

exports.signingMessage = (address, salt) => {
  return (`Welcome to Unstoppable Wallet Premium Features!

You'll be able to access pro analytics data 

--------

This is only a signature request to verify you are the owner of the address.
There are no blockchain transactions, gas fees or approvals associated with this.

--------

Wallet:
${address}
Salt:
${salt}`)
}

exports.telegramMessage = () => {
  return (`Hi, this is Unstoppable wallet support chat. 
What would you like to know?`)
}
