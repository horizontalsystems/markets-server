const morgan = require('morgan')
const mongo = require('../../db/mongo')
const serializer = require('./stats.serializer')

const logs = mongo.collection('logs')

exports.getStats = async ({ query }, res) => {
  const { group_by: groupBy, ...match } = query
  const events = await mongo.getStats(match, groupBy)
  res.send(events)
}

exports.getKeys = async (req, res) => {
  const [keys] = await mongo.getKeys()
  res.send(serializer.serializeKeys(keys))
}

exports.stats = async (req, res) => {
  const { body, headers } = req

  const ip = headers['x-real-ip'] || morgan['remote-addr'](req, res)
  const appId = headers.app_id
  const appPlatform = headers.app_platform
  const appVersion = headers.app_version
  const records = []

  try {
    for (let i = 0; i < body.length; i += 1) {
      const item = body[i]

      if (!item.event_page || !item.event) {
        continue
      }

      if (ip) item.ip = ip
      if (appId) item.appId = appId
      if (appPlatform) item.appPlatform = appPlatform
      if (appVersion) item.appVersion = appVersion

      records.push(item)
    }
  } catch (e) {
    console.log(e)
    res.status(400)
    res.send({ message: 'Invalid request' })
    return
  }

  if (!records.length) {
    res.send({})
    return
  }

  try {
    logs.insertMany(records).catch(e => console.log(e))
  } catch (e) {
    console.log(e.message)
  }

  res.send({})
}
