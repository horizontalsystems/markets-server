require('dotenv').config({
  path: '.env.test'
})

const { exec } = require('child_process')
const { random, sum, range } = require('lodash')
const { DateTime } = require('luxon')
const { sequelize } = require('./src/db/sequelize')

before(async () => {
  await factory.createDB()
  await sequelize.sync({ force: true })
})

afterEach(async () => {
  await sequelize.sync({ force: true })
})

after(async () => {
  await sequelize.close()
})

const factory = {
  data(count, mapper, duration = 'days', step = 1, min = 100, max = 1000) {
    const date = DateTime.utc()

    return range(0, count, step).map(i => {
      const value = random(min, max)
      const time = date.plus({ [duration]: -i })
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
      tvl: sum(Object.values(chainTvls)),
      chainTvls,
      ...opts,
    }
  },

  defillamaProtocolFull(name, chains) {
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

  coingeckoMarket(id, options) {
    return {
      id,
      current_price: random(10, 1000),
      market_cap: random(100, 1000),
      max_supply: random(100, 1000),
      total_supply: random(100, 1000),
      circulating_supply: random(100, 1000),
      last_updated: DateTime.utc().toISO(),
      ...options
    }
  },

  createDB: () => new Promise(resolve => {
    try {
      exec('npx sequelize-cli db:create')
      resolve()
    } catch (e) {
    }
  }),

  async truncate(...coins) {
    for (let i = 0; i < coins.length; i++) {
      const Coin = coins[i]
      await Coin.destroy({ truncate: true, cascade: true })
    }
  }
}

global.factory = factory
