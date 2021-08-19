const Sequelize = require('sequelize')
const configJson = require('./config.json')
const Coin = require('../api/coin/coin.model')
const Language = require('../api/language/language.model')
const Category = require('../api/category/category.model')
const CategoryDescription = require('../api/category-description/category-description.model')
const CoinDescription = require('../api/coin-description/coin-description.model');
const PlatformType = require('../api/platform-type/platform-type.model');
const Platform = require('../api/platform/platform.model');

const config = configJson[process.env.NODE_ENV || 'development']
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

const models = {
  Coin: Coin.init(sequelize, Sequelize),
  CoinDescription: CoinDescription.init(sequelize, Sequelize),
  Language: Language.init(sequelize, Sequelize),
  Category: Category.init(sequelize, Sequelize),
  CategoryDescription: CategoryDescription.init(sequelize, Sequelize),
  PlatformType: PlatformType.init(sequelize, Sequelize),
  Platform: Platform.init(sequelize, Sequelize),
}

// This creates relationships in the ORM
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models))

module.exports = Object.assign(models, {
  // Sequelize sync
  sync: (callback) => {
    sequelize
      .sync({ force: false })
      .then(callback)
  }
})
