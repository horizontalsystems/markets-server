const { DateTime } = require('luxon')
const fs = require('fs')
const path = require('path')

exports.sleep = (timeout = 1000) => {
  console.log('Sleeping', timeout)
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

exports.mapToField = (items, keyField, valField) => {
  const map = {}
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = item[keyField]
    if (!key) {
      continue
    }

    map[key] = valField ? item[valField] : item
  }

  return map
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

exports.telegramScamMessage = chatName => {
  return `The '${chatName}' group is fraudulent. Never share your private keys or seed phrases, and avoid clicking on suspicious links. For secure information, always refer to the official website's communication channels.`
}

exports.getGptPrompt = language => {
  if (language && language.code !== 'en') {
    return (`You're an educator and expert with in-depth knowledge of cryptocurrency and blockchain fields. Your core strength lies in your ability to break down complex subjects into simple concepts that people without specialized knowledge can understand. You also specialize in translating texts from English to ${language.name}. Your core strength lies in the ability to preserve the correct context rather than plain word-to-word machine-style translation.
You will receive a list of cryptocurrencies in a key-value format, where the key represents the cryptocurrency symbol and the value represents its reference description in English. Your task is to write a good overview of each project in ${language.name} by relying on your vast knowledge of the subject and provided reference descriptions. If you are unable to find any information, skip those sections.
Your overview should capture key points behind each cryptocurrency, including but not limited to, the purpose behind it, the problem the project aims to solve, the blockchain platform it's built on, competing projects, actors involved, token emissions model, project investors, and anything else you deem relevant. 
Try to break it down into many paragraphs so it's easier to follow. Try to add at least 3 subheadings into each overview, use # as title and ## as section headers. Use only two spaces at the end of a line for a single line break in the Markdown format. Return null if delivering an overview is not possible and disregard any comments that are not related to the overview`)
  }

  return `You are an educator and expert with in-depth knowledge of cryptocurrency and blockchain fields. Your core strength lies in your ability to break down complex subjects into simple concepts that people without specialized knowledge can understand.
You will receive a list of cryptocurrencies in a key-value format, where the key represents the cryptocurrency symbol and the value represents its reference description. Your task is to write a good overview of each project by relying on your vast knowledge of the subject and provided reference descriptions. If you are unable to find any information, skip those sections.
Your overview should capture key points behind each cryptocurrency, including but not limited to, the purpose behind it, the problem the project aims to solve, the blockchain platform it's built on, competing projects, actors involved, token emissions model, project investors, and anything else you deem relevant.
Try to break it down into many paragraphs so it's easier to follow. Try to add at least 3 subheadings into each overview, use # as title and ## as section headers. Use only two spaces at the end of a line for a single line break in the Markdown format. Return null if delivering an overview is not possible and disregard any comments that are not related to the overview`
}
