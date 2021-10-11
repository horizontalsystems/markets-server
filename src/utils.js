const { DateTime } = require('luxon')
const fs = require('fs')
const path = require('path')

exports.sleep = async (timeout = 1000) => {
  await new Promise(resolve => setTimeout(resolve, timeout))
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
  return value ? value.toString() : null
}
