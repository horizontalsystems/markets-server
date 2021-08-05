const Sequelize = require('sequelize')
const configJson = require('./config.json')
const Coin = require('../api/coin/coin.model')

const config = configJson[process.env.NODE_ENV || 'development']
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

const models = {
  Coin: Coin.init(sequelize, Sequelize)
}

// This creates relationships in the ORM
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models))

module.exports = Object.assign(models, { sequelize })
