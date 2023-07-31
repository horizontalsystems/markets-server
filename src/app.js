require('dotenv/config')

const sequelize = require('./db/sequelize')
const app = require('./config/express')

async function start() {
  await sequelize.sync()
  const port = process.env.PORT || 3000

  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}

start().catch(err => {
  console.error(err.stack)
})

// Exports express
module.exports = app
