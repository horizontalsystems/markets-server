process.env.NODE_ENV = 'test'

require('./src/db/sequelize').sync()
