const connect = require('connect-session-sequelize')
const session = require('express-session')
const express = require('express')
const morgan = require('morgan')
const compress = require('compression')
const methodOverride = require('method-override')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const helmet = require('helmet')
const middlewares = require('../api/middlewares')
const routes = require('./routes-admin')
const db = require('../db/sequelize')

// create an express application
const app = express()
const Store = connect(session.Store)

// request logging. dev: console | production: file
app.use(morgan('dev'))

// parse body params and attache them to req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// gzip compression
app.use(compress())

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride())

// secure apps by setting various HTTP headers
app.use(helmet())

// enable CORS - Cross Origin Resource Sharing
app.use(cors())

// session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
    store: new Store({ db: db.sequelize })
  })
)

const exposeHeaders = (req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count')
  next()
}

app.use(exposeHeaders)

const login = (req, res) => {
  const { username, password } = req.body
  if (username === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    const accessToken = jwt.sign({ username }, process.env.COOKIE_SECRET, { expiresIn: '30d' })
    res.json({ accessToken })
  } else {
    res.send('Username or password incorrect')
  }
}

function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    return res.sendStatus(401)
  }

  jwt.verify(token, process.env.COOKIE_SECRET, (err, payload) => {
    if (err) {
      console.log(err)
      return res.sendStatus(403)
    }

    if (!payload || payload.username !== process.env.ADMIN_EMAIL) {
      return res.sendStatus(403)
    }

    next()
  })
}

// API routes
app.post('/api/login', login)
app.use(checkAuth)
app.use('/api', routes)
app.use(middlewares.error404)
app.use(middlewares.error500)

module.exports = app
