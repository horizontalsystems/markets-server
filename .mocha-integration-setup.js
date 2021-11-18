process.env.NODE_ENV = 'test'

const { DateTime } = require('luxon')
const exec = require('child_process').exec
const db = require('./src/db/sequelize')
const _ = require('lodash')

before(async () => {
  await factory.createDB()
  await db.sync(true)
})

afterEach(async () => {
  await db.sync(true)
})

after(async () => {
  await db.sequelize.close()
})

const factory = {
  data(count, mapper, step = 'days', min = 100.1, max = 1000.0) {
    const date = DateTime.utc().startOf('day')

    return _.times(count, i => {
      const value = _.random(min, max)
      const time = date.plus({ [step]: -i })
      const data = [time.ts / 1000, value]

      return mapper ? mapper(data) : data
    })
  },

  defillamaProtocol(name, chainTvls, opts = {}) {
    return {
      name,
      slug: name,
      gecko_id: name,
      chains: Object.keys(chainTvls),
      tvl: _.sum(Object.values(chainTvls)),
      chainTvls,
      ...opts,
    }
  },

  defillamaProtocolFull: (name, chains) => {
    const totalTvls = []
    const chainTvls = {}

    const mapper = ([date, totalLiquidityUSD]) => {
      const item = { date, totalLiquidityUSD }
      const total = totalTvls.find(i => i.date === item.date)

      if (total) {
        total.totalLiquidityUSD += totalLiquidityUSD
      } else {
        totalTvls.push({ ...item })
      }

      return item
    }

    chains.forEach(chain => chainTvls[chain] = { tvl: factory.data(5, mapper) })
    return factory.defillamaProtocol(name, chainTvls, { tvl: totalTvls })
  },

  createDB: () => new Promise(resolve => {
    try {
      exec('npx sequelize-cli db:create')
      resolve()
    } catch (e) {
    }
  })
}

global.factory = factory
