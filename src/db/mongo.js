const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

module.exports = client
