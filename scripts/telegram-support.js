require('dotenv/config')

const { Command } = require('commander')
const telegram = require('../src/providers/telegram')

const program = new Command()
  .option('-m --monitor', 'Monitor spam group')
  .parse(process.argv)

async function start({ monitor }) {
  await telegram.start()

  if (monitor) {
    await telegram.monitor()
  }
}

module.exports = start(program.opts())
