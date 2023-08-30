const morgan = require('morgan')
const mongo = require('../db/mongo')

const logger = () => {
  const db = mongo.db(process.env.MONGO_DB)
  const logs = db.collection('logs')
  const write = doc => logs.insertOne(doc).catch(e => console.log(e.message))

  return (req, res, next) => {
    const referrer = morgan.referrer(req, res)
    const realIp = req.headers['x-real-ip'] || morgan['remote-addr'](req, res)
    const appId = req.headers.appid
    const appPlatform = req.headers.app_platform
    const appVersion = req.headers.app_version

    const { query } = req

    const doc = {
      method: morgan.method(req, res),
      path: req.path,
      url: morgan.url(req, res),
      remoteAddr: realIp,
      userAgent: morgan['user-agent'](req, res),
      date: new Date()
    }

    if (appPlatform) {
      doc.appPlatform = appPlatform
    }

    if (appVersion) {
      doc.appVersion = appVersion
    }

    if (query.enabled_uids) {
      doc.enabled_coins = query.enabled_uids.split(',')
    }

    if (appId) {
      doc.appId = appId
    }

    if (referrer) {
      doc.referrer = referrer
    }

    write(doc)

    next()
  }
}

module.exports = logger
