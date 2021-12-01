const config = {
  development: {
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
    pool: {
      idle: 30000,
      min: 2,
      max: 5
    },
    logging: false,
    define: {
      timestamps: false,
      underscored: true
    }
  },
  test: {
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
    pool: {
      idle: 30000,
      min: 2,
      max: 5
    },
    logging: false,
    define: {
      timestamps: false,
      underscored: true
    }
  },
  production: {
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
    pool: {
      idle: 30000,
      min: 2,
      max: 5
    },
    logging: false,
    define: {
      timestamps: false,
      underscored: true
    }
  }
}

module.exports = config[process.env.NODE_ENV || 'development']
