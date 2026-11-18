const { DateTime } = require('luxon')
const morgan = require('morgan')
const mongo = require('../../db/mongo')
const serializer = require('./stats.serializer')
const { handleError } = require('../middlewares')

const logs = mongo.collection('logs')

// Query params go into a MongoDB $match, so only plain field names with string
// values are accepted. Anything else (operators such as $expr/$where, nested
// objects, arrays) would let the caller run arbitrary queries or server-side JS.
const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

const isSafeFilter = (groupBy, match) => {
  if (groupBy !== undefined && (typeof groupBy !== 'string' || !FIELD_NAME.test(groupBy))) {
    return false
  }

  return Object.entries(match).every(([key, value]) => FIELD_NAME.test(key) && typeof value === 'string')
}

exports.getStats = async ({ query }, res) => {
  try {
    const { group_by: groupBy, start, end, ...match } = query

    if (typeof (start || '') !== 'string' || typeof (end || '') !== 'string' || !isSafeFilter(groupBy, match)) {
      handleError(res, 400, 'Invalid query')
      return
    }

    const dateRange = {
      start: parseInt(start || DateTime.now().plus({ days: -1 }).toUnixInteger(), 10),
      end: parseInt(end || DateTime.now().toUnixInteger(), 10),
    }

    const events = await mongo.getStats(match, groupBy, dateRange)

    res.send(events)
  } catch (e) {
    console.error(e)
    handleError(res, 500, 'Internal server error')
  }
}

exports.getKeys = async (req, res) => {
  const keys = await mongo.getKeys()
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
