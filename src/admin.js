require('dotenv/config')

const sequelize = require('./db/sequelize')
const admin = require('./config/express-admin')

async function start() {
  await sequelize.sync()
  const port = 3001 // process.env.PORT

  admin.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}

start().catch(err => {
  console.error(err.stack)
})

// Exports express
module.exports = admin
