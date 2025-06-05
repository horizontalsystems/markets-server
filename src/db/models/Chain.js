const SequelizeModel = require('./SequelizeModel')

class Chain extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        url: DataTypes.STRING,
        stats: DataTypes.JSONB,
        //  {
        //    market_cap: 99,
        //    protocols: 100,
        //    rank_1d: 1,
        //    rank_1w: 2,
        //    rank_1m: 3,
        //    change_1d: '2',
        //    change_1w: '7.10'
        //    change_1m: '6.10'
        //  }
        evm: DataTypes.JSONB
        // {
        //   chainId: 1,
        //   isTestnet: false,
        //   explorers: [],
        //   nativeCurrency: {},
        //   rpc: []
        // }
      },
      {
        timestamps: false,
        tableName: 'chains',
        sequelize
      }
    )
  }

  static getList(limit) {
    const query = `
      with list as (
        select uid, name, stats, (stats->>'market_cap')::numeric as mcap
        from chains
      )
      SELECT * FROM list
      WHERE mcap > 100000000
      ORDER BY mcap DESC
      ${limit ? 'LIMIT :limit' : ''}
    `

    return Chain.query(query, { limit })
  }

  static getListEvm() {
    const query = `
      SELECT
        c.uid, c.name, c.evm, p.type, p.decimals, coins.uid as coin_uid
      FROM chains c
      LEFT JOIN platforms p on p.chain_uid = c.uid AND p.type = 'native'
      LEFT JOIN coins on coins.id = p.coin_id
      WHERE c.evm IS NOT NULL
    `

    return Chain.query(query)
  }

  static getChainProtocols(chain) {
    const query = `
      SELECT
        c.uid,
        c.price,
        c.price_change_24h,
        c.price_change,
        c.market_data->'total_volume' total_volume,
        sum(least((p.circulating_supply * c.price), (c.market_data->>'market_cap')::numeric)) mcap
      FROM platforms p, coins c
      WHERE c.id = p.coin_id
        AND p.circulating_supply is not null
        AND p.chain_uid = :chain
      GROUP BY uid, price, price_change_24h, price_change, total_volume
      ORDER BY mcap desc
    `
    return Chain.query(query, { chain })
  }

  static getStats() {
    return Chain.query(`
      SELECT
        p.chain_uid as uid,
        sum(least((p.circulating_supply * c.price), (c.market_data->>'market_cap')::numeric)) mcap,
        count(p) as protocols
      FROM platforms p, coins c
      WHERE c.id = p.coin_id
        AND p.circulating_supply is not null
        AND p.chain_uid is not null
      GROUP BY p.chain_uid
      ORDER BY mcap desc
    `)
  }

  static updateStats(values) {
    const query = `
      UPDATE chains AS c 
        set stats = v.stats::json
      FROM (values :values) as v(uid, stats)
      WHERE c.uid = v.uid
    `

    return Chain.queryUpdate(query, { values })
  }

  static updateNames(values) {
    const query = `
      UPDATE chains AS c 
        set name = v.name::text
      FROM (values :values) as v(uid, name)
      WHERE c.uid = v.uid
    `

    return Chain.queryUpdate(query, { values })
  }

}

module.exports = Chain
