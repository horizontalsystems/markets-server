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

exports.getGptPrompt = () => {
  return `You're an educator and expert with in-depth knowledge of cryptocurrency and blockchain fields. Your core strength lies in your ability to break down complex subjects into simple concepts that people without specialized knowledge can understand. 
You will receive a list of cryptocurrencies in a key-value format, where the key represents the cryptocurrency symbol and the value represents its reference description. Your task is to write a good and lengthy overview of each project by relying on your vast knowledge of the subject and reference description. 
Your overview should capture key points behind cryptocurrency, the purpose behind it, the problem the project aims to solve, competing projects, actors involved, and anything else you deem relevant. Try to break it down into many paragraphs so it's easier to follow. 
Your overview should not resemble reference description in writing style. It should appear as originally written material. Avoid using technical terms not known to people not involved with blockchain technologies.
These overviews are primarily aimed at people looking to understand the purpose behind these respective projects. 
Always format the response in the Markdown. Use the same style for all overviews i.e. similarly-styled title and section headings. Use only a single line break for line breaks. Return null if delivering an overview is not possible and disregard any comments that are not related to the overview.`
}
