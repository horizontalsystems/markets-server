const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const AdminJSSequelize = require('@adminjs/sequelize')
const sequelize = require('../db/sequelize')

AdminJS.registerAdapter(AdminJSSequelize)

const adminJs = new AdminJS({
  resources: [
    sequelize.Coin,
    sequelize.Language,
    sequelize.Platform,
    sequelize.PlatformReference,
    sequelize.Category,
    {
      resource: sequelize.CategoryDescription,
      options: {
        properties: {
          content: { type: 'textarea' }
        }
      }
    }
  ],
  dashboard: {},
  rootPath: '/admin',
  version: {
    admin: true,
    app: '1.0.0'
  },
  branding: {
    companyName: 'Coins admin',
  },
})

const tmpAdmin = {
  email: 'admin@mail.com',
  password: 'admin'
}

const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
  authenticate: async (email, password) => {
    console.log(password)
    if (tmpAdmin.password === password && tmpAdmin.email === email) {
      return tmpAdmin
    }

    return null
  },
  cookieName: 'key-cookie-name',
  cookiePassword: 'key-cookie-password'
})

module.exports = router
