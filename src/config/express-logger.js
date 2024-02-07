const morgan = require('morgan')
const mongo = require('../db/mongo')

const logger = () => {
  const logs = mongo.collection('logs')

  const write = doc => logs.insertOne(doc).catch(e => console.log(e))

  return (req, res, next) => {
    if (process.env.SKIP_STATS) {
      return next()
    }

    const referrer = morgan.referrer(req, res)
    const realIp = req.headers['x-real-ip'] || morgan['remote-addr'](req, res)
    const appId = req.headers.app_id
    const appTag = req.headers.app_tag
    const appPlatform = req.headers.app_platform
    const appVersion = req.headers.app_version

    const { query } = req

    const doc = {
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

    if (query.interval) {
      doc.interval = query.interval
    }

    if (appId) {
      doc.appId = appId
    }

    if (appTag) {
      doc.resource = appTag
    }

    if (referrer) {
      doc.referrer = referrer
    }

    write(doc)

    next()
  }
}

module.exports = logger
