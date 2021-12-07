require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CurrencyRateSyncer = require('../src/services/CurrencyRateSyncer')

const program = new Command()
  .option('-f --fetch', 'fetch new currencies')
  .option('-c --currencies <currencies>', 'sync only given currencies')
  .parse(process.argv)

async function start({ fetch, currencies }) {
  await sequelize.sync()
  const syncer = new CurrencyRateSyncer()

  if (fetch) {
    await syncer.fetchCurrencies()
  } else if (currencies) {
    await syncer.syncHistorical(currencies.split(','))
  } else {
    await syncer.start()
  }
}

module.exports = start(program.opts())
