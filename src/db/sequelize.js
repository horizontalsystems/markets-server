const Sequelize = require('sequelize')
const configJson = require('./config.json')
const Coin = require('./models/Coin')
const CoinCategories = require('./models/CoinCategories')
const CoinTvl = require('./models/CoinTvl')
const Language = require('./models/Language')
const Category = require('./models/Category')
const Platform = require('./models/Platform')
const Fund = require('./models/Fund')
const FundsInvested = require('./models/FundsInvested')
const Treasury = require('./models/Treasury')
const Transaction = require('./models/Transaction')
const DexVolume = require('./models/DexVolume')
const DexLiquidity = require('./models/DexLiquidity')
const Address = require('./models/Address')
const CoinHolder = require('./models/CoinHolder')
const AddressRank = require('./models/AddressRank')
const Currency = require('./models/Currency')
const CurrencyRate = require('./models/CurrencyRate')
const GlobalMarket = require('./models/GlobalMarket')

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
  Category: Category.init(sequelize, Sequelize),
  CoinCategories: CoinCategories.init(sequelize, Sequelize),
  CoinTvl: CoinTvl.init(sequelize, Sequelize),
  Language: Language.init(sequelize, Sequelize),
  Platform: Platform.init(sequelize, Sequelize),
  Fund: Fund.init(sequelize, Sequelize),
  FundsInvested: FundsInvested.init(sequelize, Sequelize),
  Treasury: Treasury.init(sequelize, Sequelize),
  Transaction: Transaction.init(sequelize, Sequelize),
  DexVolume: DexVolume.init(sequelize, Sequelize),
  DexLiquidity: DexLiquidity.init(sequelize, Sequelize),
  Address: Address.init(sequelize, Sequelize),
  AddressRank: AddressRank.init(sequelize, Sequelize),
  CoinHolder: CoinHolder.init(sequelize, Sequelize),
  Currency: Currency.init(sequelize, Sequelize),
  CurrencyRate: CurrencyRate.init(sequelize, Sequelize),
  GlobalMarket: GlobalMarket.init(sequelize, Sequelize)
}

// This creates relationships in the ORM
Object.values(db)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(db))

// Sequelize
db.sequelize = sequelize
db.sync = () => sequelize.sync({ force: false })

module.exports = db
