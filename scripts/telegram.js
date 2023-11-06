require('dotenv').config()

const telegram = require('../src/providers/telegram')

async function main() {
  await telegram.monitor()
}

main().then(console.log)
