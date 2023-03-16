const SequelizeModel = require('./SequelizeModel')

class CoinHolderStats extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        total: {
          type: DataTypes.STRING,
          allowNull: false
        },
        holders: DataTypes.JSONB
      },
      {
        sequelize,
        tableName: 'coin_holder_stats',
        indexes: [{
          unique: true,
          fields: ['platform_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinHolderStats.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async getList(uid, chain = 'ethereum') {
    const query = (`
      SELECT
         p.type,
         p.address,
         h.total as count,
         h.holders as top_holders
        FROM coin_holder_stats h
        JOIN platforms p on p.id = h.platform_id
        JOIN coins c on c.id = p.coin_id
       WHERE c.uid = :uid
         AND p.chain_uid = :chain
    `)

    const [holders] = await CoinHolderStats.query(query, { chain, uid })
    return holders
  }

  static async getTotalByPlatforms(platforms) {
    const query = (`
      SELECT
        p.chain_uid as blockchain_uid,
        h.total as holders_count
       FROM coin_holder_stats h, platforms p
      WHERE p.id = h.platform_id
        AND h.platform_id in (:platforms)
      ORDER BY holders_count ASC
    `)

    return CoinHolderStats.query(query, { platforms })
  }

  static async exists() {
    return !!await CoinHolderStats.findOne()
  }

  static deleteAll(platformId) {
    return CoinHolderStats.query('DELETE FROM coin_holders where platform_id = :platformId', { platformId })
  }

}

module.exports = CoinHolderStats
