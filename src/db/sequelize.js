const Sequelize = require('sequelize')
const Coin = require('./models/Coin')
const CoinCategories = require('./models/CoinCategories')
const CoinTvl = require('./models/DefiProtocolTvl')
const DefiProtocol = require('./models/DefiProtocol')
const Language = require('./models/Language')
const Category = require('./models/Category')
const CategoryMarketCap = require('./models/CategoryMarketCap')
const Platform = require('./models/Platform')
const Fund = require('./models/Fund')
const FundsInvested = require('./models/FundsInvested')
const Treasury = require('./models/Treasury')
const TreasuryEntity = require('./models/TreasuryEntity')
const Report = require('./models/Report')
const Transaction = require('./models/Transaction')
const DexVolume = require('./models/DexVolume')
const DexLiquidity = require('./models/DexLiquidity')
const Address = require('./models/Address')
const CoinHolder = require('./models/CoinHolder')
const Currency = require('./models/Currency')
const CurrencyRate = require('./models/CurrencyRate')
const GlobalMarket = require('./models/GlobalMarket')
const CoinPrice = require('./models/CoinPrice')
const NftCollection = require('./models/NftCollection')
const NftAsset = require('./models/NftAsset')
const NftMarket = require('./models/NftMarket')
const AuthKey = require('./models/AuthKey')
const UpdateState = require('./models/UpdateState')
const config = require('./config')

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

// Models
const db = {
  Coin: Coin.init(sequelize, Sequelize),
  DefiProtocol: DefiProtocol.init(sequelize, Sequelize),
  Category: Category.init(sequelize, Sequelize),
  CategoryMarketCap: CategoryMarketCap.init(sequelize, Sequelize),
  CoinCategories: CoinCategories.init(sequelize, Sequelize),
  CoinTvl: CoinTvl.init(sequelize, Sequelize),
  Language: Language.init(sequelize, Sequelize),
  Platform: Platform.init(sequelize, Sequelize),
  Fund: Fund.init(sequelize, Sequelize),
  FundsInvested: FundsInvested.init(sequelize, Sequelize),
  TreasuryEntity: TreasuryEntity.init(sequelize, Sequelize),
  Treasury: Treasury.init(sequelize, Sequelize),
  Report: Report.init(sequelize, Sequelize),
  Transaction: Transaction.init(sequelize, Sequelize),
  DexVolume: DexVolume.init(sequelize, Sequelize),
  DexLiquidity: DexLiquidity.init(sequelize, Sequelize),
  Address: Address.init(sequelize, Sequelize),
  CoinHolder: CoinHolder.init(sequelize, Sequelize),
  Currency: Currency.init(sequelize, Sequelize),
  CurrencyRate: CurrencyRate.init(sequelize, Sequelize),
  GlobalMarket: GlobalMarket.init(sequelize, Sequelize),
  CoinPrice: CoinPrice.init(sequelize, Sequelize),
  NftCollection: NftCollection.init(sequelize, Sequelize),
  NftAsset: NftAsset.init(sequelize, Sequelize),
  NftMarket: NftMarket.init(sequelize, Sequelize),
  AuthKey: AuthKey.init(sequelize, Sequelize),
  UpdateState: UpdateState.init(sequelize, Sequelize)
}

// This creates relationships in the ORM
Object.values(db)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(db))

// Sequelize
db.sequelize = sequelize
db.sync = async () => {
  try {
    await sequelize.sync()
  } catch (e) {
    console.log(e)
    throw e
  }
}

module.exports = db
