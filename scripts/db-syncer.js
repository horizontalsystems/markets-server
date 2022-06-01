require('dotenv/config')

const { differenceBy, chunk } = require('lodash')
const { Command } = require('commander')

const Sequelize = require('sequelize')
const sequelize = require('../src/db/sequelize')
const Coin = require('../src/db/models/Coin')
const Platform = require('../src/db/models/Platform')

const program = new Command()
  .option('-u --user <user>', 'database user')
  .option('-p --pass <pass>', 'database pass')
  .option('-h --host <host>', 'database host')
  .option('-m --model <model>', 'sync specific model')
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

  async syncAll() {
    const allCoins = await this.query('SELECT * FROM coins')
    const oldCoins = await Coin.findAll({ attributes: ['uid'] })
    const newCoins = differenceBy(allCoins, oldCoins, 'uid')

    await this.upsertCoins(newCoins)
    const models = [
      'Category',
      'CategoryMarketCap',
      'CoinCategories',
      'CoinHolder',
      'CoinMarket',
      'Exchange',
      'Chain',
      'ChainMarketCap',
      'Language',
      'Fund',
      'FundsInvested',
      'TreasuryEntity',
      'Treasury',
      'Report',
      'AddressLabel',
      'Currency',
      'CurrencyRate',
      'NftCollection',
      'NftAsset',
      'NftMarket',
      'NftHolder',
      'AuthKey',
      'EvmMethodLabel'
    ]

    for (let i = 0; i < models.length; i += 1) {
      await this.syncModel(sequelize[models[i]])
    }

    await this.syncPlatforms(newCoins.map(coin => coin.id))

    console.log('Synced')
  }

  async syncPlatforms(coinIds) {
    const platforms = await this.query('SELECT * FROM platforms WHERE coin_id IN(:coinIds)', { coinIds })
    await Platform.bulkCreate(platforms, { ignoreDuplicates: true })
  }

  async syncModel(Model) {
    if (!Model) return

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

async function start({ model, user, pass, host = 'localhost' }) {
  await sequelize.sync()
  const dbSyncer = new Syncer(user, pass, host)

  if (model) {
    await dbSyncer.syncModel(sequelize[model])
  } else {
    await dbSyncer.syncAll()
  }
}

module.exports = start(program.opts())
