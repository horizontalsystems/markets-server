const Sequelize = require('sequelize')
const configJson = require('./config.json')
const Coin = require('./models/Coin')
const CoinDescription = require('./models/CoinDescription')
const Language = require('./models/Language')
const Category = require('./models/Category')
const CategoryDescription = require('./models/CategoryDescription')
const Platform = require('./models/Platform')
const Transaction = require('./models/Transaction')

const config = configJson[process.env.NODE_ENV || 'development']
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

// Models
const db = {
  Coin: Coin.init(sequelize, Sequelize),
  CoinDescription: CoinDescription.init(sequelize, Sequelize),
  Language: Language.init(sequelize, Sequelize),
  Category: Category.init(sequelize, Sequelize),
  CategoryDescription: CategoryDescription.init(sequelize, Sequelize),
  Platform: Platform.init(sequelize, Sequelize),
  Transaction: Transaction.init(sequelize, Sequelize)
}

// This creates relationships in the ORM
Object.values(db)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(db))

// Sequelize
db.sequelize = sequelize
db.sync = () => sequelize.sync({ force: false })

module.exports = db
