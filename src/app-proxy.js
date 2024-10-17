require('dotenv/config')

const app = require('./config/express-proxy')

async function start() {
  const port = 3005

  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}

start().catch(err => {
  console.error(err.stack)
})

// Exports express
module.exports = app
