require('dotenv/config')

const logger = require('./config/logger')
const sequelize = require('./db/sequelize')
const app = require('./config/express')

async function start() {
  await sequelize.sync()
  const port = process.env.PORT || 3000

  app.listen(port, () => {
    logger.info(`Server started on port ${port}`)
  })
}

start().catch(err => {
  logger.error(err.stack)
})

// Exports express
module.exports = app
