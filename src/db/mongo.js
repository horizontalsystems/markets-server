const { MongoClient } = require('mongodb')

const mongo = {}
const THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

mongo.getStats = async (match, groupBy) => {
  const logs = mongo.collection('logs')

  const pipeline = [
    { $match: match },
    { $group: { _id: `$${groupBy}`, requestCount: { $sum: 1 }, uniqueCount: { $addToSet: '$appId' } } },
    { $project: { requestCount: 1, uniqueUsers: { $size: '$uniqueCount' } } },
    { $sort: { requestCount: -1 } }
  ]

  return logs.aggregate(pipeline).toArray()
}

const getKeysAndUpdateCache = async (keysCache) => {
  const logs = mongo.collection('logs')

  const pipeline = [
    { $project: { keys: { $objectToArray: '$$ROOT' } } },
    { $unwind: '$keys' },
    { $match: { 'keys.k': { $ne: '_id' } } },
    { $group: { _id: null, keys: { $addToSet: '$keys.k' } } },
    { $project: { _id: 0, keys: 1 } }
  ]

  const keysResult = await logs.aggregate(pipeline).toArray()
  const keys = keysResult.length > 0 ? keysResult[0].keys : []

  await keysCache.updateOne(
    { _id: 'cached-logs-keys' },
    { $set: { keys, updatedAt: new Date() } },
    { upsert: true }
  )

  return keys
}

mongo.getKeys = async () => {
  const logKeys = mongo.collection('logs-keys')
  const cachedResult = await logKeys.findOne({ _id: 'cached-logs-keys' })
  const now = new Date()

  if (cachedResult) {
    if (now - cachedResult.updatedAt <= THRESHOLD) {
      return cachedResult.keys
    }

    getKeysAndUpdateCache(logKeys).catch(console.error)
    return cachedResult.keys
  }

  return getKeysAndUpdateCache(logKeys)
}

mongo.collection = (name) => {
  const client = mongo.client()
  const conn = client.db(process.env.MONGO_DB)
  return conn.collection(name)
}

mongo.init = async () => {
  const client = mongo.client()

  const connect = await client.connect()
  const database = client.db(process.env.MONGO_DB)
  const logs = database.collection('logs')

  await logs.createIndex({ page: 1 })
  await logs.createIndex({ event: 1 })
  await logs.createIndex({ event_page: 1 })
  await logs.createIndex({ event_section: 1 })
  await logs.createIndex({ coin_uid: 1 })
  await logs.createIndex({ tab: 1 })
  await logs.createIndex({ time: 1 })

  return connect
}

mongo.client = () => {
  if (!mongo._client) {
    mongo._client = new MongoClient(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  }

  return mongo._client
}

module.exports = mongo
