require('dotenv/config')

const { differenceBy, chunk } = require('lodash')
const { Command } = require('commander')

const Sequelize = require('sequelize')
const sequelize = require('../src/db/sequelize')
const Coin = require('../src/db/models/Coin')
const Platform = require('../src/db/models/Platform')
const Chain = require('../src/db/models/Chain')
const AddressLabel = require('../src/db/models/AddressLabel')
const Category = require('../src/db/models/Category')
const CoinCategories = require('../src/db/models/CoinCategories')
const CategoryMarketCap = require('../src/db/models/CategoryMarketCap')
const CoinHolder = require('../src/db/models/CoinHolder')
const CoinMarket = require('../src/db/models/CoinMarket')
const Exchange = require('../src/db/models/Exchange')
const ChainMarketCap = require('../src/db/models/ChainMarketCap')
const Language = require('../src/db/models/Language')
const Fund = require('../src/db/models/Fund')
const FundsInvested = require('../src/db/models/FundsInvested')
const TreasuryEntity = require('../src/db/models/TreasuryEntity')
const Treasury = require('../src/db/models/Treasury')
const Report = require('../src/db/models/Report')
const Transaction = require('../src/db/models/Transaction')
const DexVolume = require('../src/db/models/DexVolume')
const DexLiquidity = require('../src/db/models/DexLiquidity')
const Address = require('../src/db/models/Address')
const Currency = require('../src/db/models/Currency')
const CurrencyRate = require('../src/db/models/CurrencyRate')
const GlobalMarket = require('../src/db/models/GlobalMarket')
const NftCollection = require('../src/db/models/NftCollection')
const NftAsset = require('../src/db/models/NftAsset')
const NftMarket = require('../src/db/models/NftMarket')
const NftHolder = require('../src/db/models/NftHolder')
const EvmMethodLabel = require('../src/db/models/EvmMethodLabel')

const program = new Command()
  .option('-u --user <user>', 'database user')
  .option('-p --pass <pass>', 'database pass')
  .option('-h --host <host>', 'database host')
  .parse(process.argv)

class Syncer {
  constructor(username, password, host) {
    this.db = new Sequelize('markets', username, password, {
      host,
      port: 5432,
      dialect: 'postgres',
      logging: false
    })
  }

  async sync() {
    const allCoins = await this.query('SELECT * FROM coins')
    const oldCoins = await Coin.findAll({ attributes: ['uid'] })
    const newCoins = differenceBy(allCoins, oldCoins, 'uid')

    await this.upsertCoins(newCoins)
    const models = [
      Chain,
      Category,
      CategoryMarketCap,
      CoinCategories,
      CoinHolder,
      CoinMarket,
      // CoinPrice,
      Exchange,
      ChainMarketCap,
      // DefiProtocol,
      // DefiProtocolTvl,
      Language,
      Fund,
      FundsInvested,
      TreasuryEntity,
      Treasury,
      Report,
      Transaction,
      DexVolume,
      DexLiquidity,
      Address,
      AddressLabel,
      EvmMethodLabel,
      Currency,
      CurrencyRate,
      GlobalMarket,
      NftCollection,
      NftAsset,
      NftMarket,
      NftHolder
    ]

    for (let i = 0; i < models.length; i += 1) {
      await this.syncModel(models[i])
    }

    await this.syncPlatforms(newCoins.map(coin => coin.id))

    console.log('Synced')
  }

  async syncPlatforms(coinIds) {
    const platforms = await this.query('SELECT * FROM platforms WHERE coin_id IN(:coinIds)', { coinIds })
    await Platform.bulkCreate(platforms, { ignoreDuplicates: true })
  }

  async syncModel(Model) {
    const records = await this.query(`SELECT * FROM ${Model.tableName}`)
    const chunks = chunk(records, 400000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Model.bulkCreate(chunks[i], { ignoreDuplicates: true })
        .then(data => {
          console.log(`Inserted ${Model.name} records`, data.length)
        })
        .catch(err => {
          console.log(err.message)
        })
    }
  }

  async query(sql, replacements) {
    const [result] = await this.db.query(sql, { replacements, raw: true })
    return result
  }

  upsertCoins(records) {
    return Coin.bulkCreate(records, { ignoreDuplicates: true })
  }
}

async function start({ user, pass, host = 'localhost' }) {
  await sequelize.sync()

  const dbSyncer = new Syncer(user, pass, host)
  await dbSyncer.sync()
}

module.exports = start(program.opts())
