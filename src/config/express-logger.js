const morgan = require('morgan')
const mongo = require('../db/mongo')

const logger = () => {
  const db = mongo.db(process.env.MONGO_DB)
  const logs = db.collection('logs')
  const write = doc => logs.insertOne(doc).catch(e => console.log(e.message))

  return (req, res, next) => {
    const referrer = morgan.referrer(req, res)
    const realIp = req.headers['x-real-ip'] || morgan['remote-addr'](req, res)

    const doc = {
      method: morgan.method(req, res),
      path: req.path,
      url: morgan.url(req, res),
      remoteAddr: realIp,
      userAgent: morgan['user-agent'](req, res),
      date: new Date()
    }

    if (referrer) {
      doc.referrer = referrer
    }

    write(doc)

    next()
  }
}

module.exports = logger
