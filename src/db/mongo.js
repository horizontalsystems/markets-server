const { MongoClient } = require('mongodb')

const mongo = {}

mongo.getPopularCoins = async () => {
  const logs = mongo.collection('logs')
  const coins = await logs.aggregate([
    { $match: { enabled_coins: { $ne: null } } },
    { $project: { appId: '$appId', coins: '$enabled_coins' } },
    { $unwind: '$coins' },
    { $group: { _id: '$coins', requestCount: { $sum: 1 }, uniqueCount: { $addToSet: '$appId' } } },
    { $project: { requestCount: 1, uniqueCount: { $size: '$uniqueCount' } } },
    { $sort: { uniqueCount: -1 } },
    { $limit: 100 },
  ]).toArray()

  return coins
}

mongo.getPopularResources = async () => {
  const logs = mongo.collection('logs')
  const resources = await logs.aggregate([
    { $match: { resource: { $ne: null } } },
    { $group: { _id: '$resource', requestCount: { $sum: 1 }, uniqueCount: { $addToSet: '$appId' } } },
    { $project: { requestCount: 1, uniqueCount: { $size: '$uniqueCount' } } },
    { $sort: { uniqueCount: -1 } },
    { $limit: 100 },
  ]).toArray()

  return resources
}

mongo.storeStats = async (items, collectionName) => {
  if (!items.length) {
    return
  }

  const collection = mongo.collection(collectionName)
  await collection.drop()
  await collection.insertMany(items)
}

mongo.getStats = async (collectionName) => {
  const collection = mongo.collection(collectionName)
  const items = await collection.find().toArray()

  if (!items || !items.length) {
    return []
  }

  return items
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

  await logs.createIndex({ path: 1 })
  await logs.createIndex({ resource: 1 })

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
