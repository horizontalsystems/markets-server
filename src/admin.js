require('dotenv/config')

const logger = require('./config/logger')
const sequelize = require('./db/sequelize')
const admin = require('./config/express-admin')

async function start() {
  await sequelize.sync()
  const port = process.env.PORT || 3001

  admin.listen(port, () => {
    logger.info(`Server started on port ${port}`)
  })
}

start().catch(err => {
  logger.error(err.stack)
})

// Exports express
module.exports = admin
