const SequelizeModel = require('./SequelizeModel')

class NftCollection extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        asset_contracts: DataTypes.JSONB,
        // [
        //   {
        //     "address": "0x0000..",
        //     "type": "ERC721"
        //   }
        // ]
        image_data: DataTypes.JSONB,
        // {
        //   "image_url",
        //   "featured_image_url"
        // }
        stats: DataTypes.JSONB,
        // {
        //   "one_day_volume": 0.0,
        //   "one_day_change": 0.0,
        //   "one_day_sales": 0.0,
        //   "one_day_average_price": 0.0,
        //   "seven_day_volume": 0.0,
        //   "seven_day_change": 0.0,
        //   "seven_day_sales": 0.0,
        //   "seven_day_average_price": 0.0,
        //   "thirty_day_volume": 0.0,
        //   "thirty_day_change": 0.0,
        //   "thirty_day_sales": 0.0,
        //   "thirty_day_average_price": 0.0,
        //   "total_volume": 0.0,
        //   "total_sales": 0.0,
        //   "total_supply": 1.0,
        //   "count": 1.0,
        //   "num_owners": 1,
        //   "average_price": 0.0,
        //   "num_reports": 0,
        //   "market_cap": 0.0,
        //   "floor_price": 0
        // }
        links: DataTypes.JSONB,
        // {
        //   "external_url":
        //   "discord_url":
        //   "telegram_url":,
        //   "twitter_username":,
        //   "instagram_username":,
        //   "wiki_url":
        // }
        description: DataTypes.TEXT,
        last_updated: DataTypes.DATE
      },
      {
        timestamps: false,
        tableName: 'nft_collections',
        sequelize
      }
    )
  }

  static upsertCollections(collections) {
    NftCollection.bulkCreate(collections, {
      updateOnDuplicate: ['stats', 'last_updated']
    }).then(() => {
      console.log('Collections successfully inserted')
    })
      .catch(err => {
        console.error('Error inserting nft collections', err.message)
      })
  }

  static async getCachedCollection(collectionUid) {
    const query = (`
      SELECT *
      FROM nft_collections
      WHERE uid = :collectionUid
            AND ABS(EXTRACT(epoch FROM (last_updated - now()))::int/60) <= 5
    `)

    const [asset] = await NftCollection.query(query, { collectionUid })
    return asset
  }

  static async getCollections(offset = 0, limit = 100) {
    const query = (`
      SELECT uid, name, image_data, stats, last_updated
      FROM nft_collections
      ORDER BY DATE_TRUNC('hour', last_updated) DESC, (stats ->> 'total_volume')::float DESC
      OFFSET :offset
      LIMIT :limit
    `)

    return NftCollection.query(query, { offset, limit })
  }

  static getByUids(uids) {
    const where = { uid: uids }
    return NftCollection.findAll({ where })
  }

  static async getTopMovers() {
    const [stats] = await NftCollection.query(`
      with collections as (select uid, name, stats, image_data, DATE_TRUNC('hour', last_updated) as update_date from nft_collections ),
      one as (select * from collections order by update_date DESC, stats->'one_day_volume' desc limit 5),
      seven as (select * from collections order by update_date DESC, stats->'seven_day_volume' desc limit 5),
      thirty as (select * from collections order by update_date DESC, stats->'thirty_day_volume' desc limit 5)
      select jsonb_build_object(
        'one_day', (select json_agg(one.*) from one),
        'seven_day', (select json_agg(seven.*) from seven),
        'thirty_day', (select json_agg(thirty.*) from thirty)
      ) as data
    `)

    if (!stats) {
      return {
        one_day: [],
        seven_day: [],
        thirty_day: []
      }
    }

    return stats.data
  }

}

module.exports = NftCollection
