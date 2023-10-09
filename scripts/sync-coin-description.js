require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinDescriptionSyncer = require('../src/services/CoinDescriptionSyncer')
const Language = require('../src/db/models/Language')

const program = new Command()
  .option('-c --coins <coins>', 'get coin overview from GPT')
  .option('-l --language <language>', 'get coin overview from GPT for the specified coin')
  .parse(process.argv)

async function start({ coins, language }) {
  await sequelize.sync()
  const syncer = new CoinDescriptionSyncer()

  let lang = null
  if (language) {
    lang = await Language.findOne({
      where: {
        code: language
      }
    })

    if (!lang) {
      throw new Error('Invalid language')
    }
  }

  if (coins) {
    await syncer.sync(coins.split(','), lang)
  } else {
    await syncer.start(lang)
  }
}

module.exports = start(program.opts())
