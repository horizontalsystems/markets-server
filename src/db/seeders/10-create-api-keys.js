require('dotenv/config')

const { ApiKey } = require('../sequelize')
const records = require('./api-keys.json')

module.exports = {
  up: async () => {
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i]
      await ApiKey.upsert(record)
    }
  },

  down: async () => {
  }
}
