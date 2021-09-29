const fs = require('fs')
const path = require('path')

exports.sleep = async (timeout = 1000) => {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

exports.isSameDay = date => {
  const today = new Date()
  return (
    today.getFullYear() === date.getFullYear()
    && today.getDate() === date.getDate()
    && today.getMonth() === date.getMonth()
  )
}

exports.requireFile = file => {
  return fs.readFileSync(path.resolve(__dirname, file), 'utf8')
}

exports.nullOrString = value => {
  return value ? value.toString() : null
}
