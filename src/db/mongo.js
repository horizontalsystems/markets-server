const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const mongo = {
  connect() {
    return client.connect()
  },
  collection(name) {
    const conn = client.db(process.env.MONGO_DB)
    return conn.collection(name)
  },
  async init() {
    const connect = await client.connect()
    const database = client.db(process.env.MONGO_DB)
    const logs = database.collection('logs')

    await logs.createIndex({ path: 1 })
    await logs.createIndex({ resource: 1 })

    return connect
  }
}

module.exports = mongo
