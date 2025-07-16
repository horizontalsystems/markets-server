const Sequelize = require('sequelize')
const Coin = require('./models/Coin')
const CoinIndicator = require('./models/CoinIndicator')
const CoinCategories = require('./models/CoinCategories')
const CoinHolder = require('./models/CoinHolder')
const CoinHolderStats = require('./models/CoinHolderStats')
const CoinPrice = require('./models/CoinPrice')
const CoinStats = require('./models/CoinStats')
const CoinAudit = require('./models/CoinAudit')
const CoinMarket = require('./models/CoinMarket')
const CoinTicker = require('./models/CoinTicker')
const VerifiedExchange = require('./models/VerifiedExchange')
const Exchange = require('./models/Exchange')
const DefiProtocol = require('./models/DefiProtocol')
const DefiProtocolTvl = require('./models/DefiProtocolTvl')
const Language = require('./models/Language')
const Category = require('./models/Category')
const CategoryMarketCap = require('./models/CategoryMarketCap')
const Chain = require('./models/Chain')
const ChainMarketCap = require('./models/ChainMarketCap')
const Platform = require('./models/Platform')
const ContractIssue = require('./models/ContractIssue')
const Fund = require('./models/Fund')
const FundsInvested = require('./models/FundsInvested')
const Treasury = require('./models/Treasury')
const TreasuryEntity = require('./models/TreasuryEntity')
const TreasuryCompany = require('./models/TreasuryCompany')
const Report = require('./models/Report')
const Transaction = require('./models/Transaction')
const DexVolume = require('./models/DexVolume')
const DexLiquidity = require('./models/DexLiquidity')
const Address = require('./models/Address')
const Currency = require('./models/Currency')
const CurrencyRate = require('./models/CurrencyRate')
const GlobalMarket = require('./models/GlobalMarket')
const NftCollection = require('./models/NftCollection')
const NftAsset = require('./models/NftAsset')
const NftMarket = require('./models/NftMarket')
const NftHolder = require('./models/NftHolder')
const Subscription = require('./models/Subscription')
const VipSupportGroup = require('./models/VipSupportGroup')
const AuthKey = require('./models/AuthKey')
const UpdateState = require('./models/UpdateState')
const EvmMethodLabel = require('./models/EvmMethodLabel')
const AddressLabel = require('./models/AddressLabel')
const Block = require('./models/Block')
const TokenUnlock = require('./models/TokenUnlock')
const Etf = require('./models/Etf')
const EtfDailyInflow = require('./models/EtfDailyInflow')
const EtfTotalInflow = require('./models/EtfTotalInflow')
const Stock = require('./models/Stock')
const Vault = require('./models/Vault')
const config = require('./config')

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

// Models
const db = {
  Category: Category.init(sequelize, Sequelize),
  CategoryMarketCap: CategoryMarketCap.init(sequelize, Sequelize),
  Coin: Coin.init(sequelize, Sequelize),
  CoinIndicator: CoinIndicator.init(sequelize, Sequelize),
  CoinCategories: CoinCategories.init(sequelize, Sequelize),
  CoinHolder: CoinHolder.init(sequelize, Sequelize),
  CoinHolderStats: CoinHolderStats.init(sequelize, Sequelize),
  CoinMarket: CoinMarket.init(sequelize, Sequelize),
  CoinTicker: CoinTicker.init(sequelize, Sequelize),
  CoinPrice: CoinPrice.init(sequelize, Sequelize),
  CoinStats: CoinStats.init(sequelize, Sequelize),
  CoinAudit: CoinAudit.init(sequelize, Sequelize),
  Exchange: Exchange.init(sequelize, Sequelize),
  VerifiedExchange: VerifiedExchange.init(sequelize, Sequelize),
  Chain: Chain.init(sequelize, Sequelize),
  ChainMarketCap: ChainMarketCap.init(sequelize, Sequelize),
  DefiProtocol: DefiProtocol.init(sequelize, Sequelize),
  DefiProtocolTvl: DefiProtocolTvl.init(sequelize, Sequelize),
  Language: Language.init(sequelize, Sequelize),
  Platform: Platform.init(sequelize, Sequelize),
  ContractIssue: ContractIssue.init(sequelize, Sequelize),
  Fund: Fund.init(sequelize, Sequelize),
  FundsInvested: FundsInvested.init(sequelize, Sequelize),
  TreasuryCompany: TreasuryCompany.init(sequelize, Sequelize),
  TreasuryEntity: TreasuryEntity.init(sequelize, Sequelize),
  Treasury: Treasury.init(sequelize, Sequelize),
  Report: Report.init(sequelize, Sequelize),
  Transaction: Transaction.init(sequelize, Sequelize),
  DexVolume: DexVolume.init(sequelize, Sequelize),
  DexLiquidity: DexLiquidity.init(sequelize, Sequelize),
  Address: Address.init(sequelize, Sequelize),
  AddressLabel: AddressLabel.init(sequelize, Sequelize),
  Currency: Currency.init(sequelize, Sequelize),
  CurrencyRate: CurrencyRate.init(sequelize, Sequelize),
  GlobalMarket: GlobalMarket.init(sequelize, Sequelize),
  NftCollection: NftCollection.init(sequelize, Sequelize),
  NftAsset: NftAsset.init(sequelize, Sequelize),
  NftMarket: NftMarket.init(sequelize, Sequelize),
  NftHolder: NftHolder.init(sequelize, Sequelize),
  Subscription: Subscription.init(sequelize, Sequelize),
  VipSupportGroup: VipSupportGroup.init(sequelize, Sequelize),
  AuthKey: AuthKey.init(sequelize, Sequelize),
  EvmMethodLabel: EvmMethodLabel.init(sequelize, Sequelize),
  Block: Block.init(sequelize, Sequelize),
  Etf: Etf.init(sequelize, Sequelize),
  EtfDailyInflow: EtfDailyInflow.init(sequelize, Sequelize),
  EtfTotalInflow: EtfTotalInflow.init(sequelize, Sequelize),
  Stock: Stock.init(sequelize, Sequelize),
  Vault: Vault.init(sequelize, Sequelize),
  TokenUnlock: TokenUnlock.init(sequelize, Sequelize),
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
