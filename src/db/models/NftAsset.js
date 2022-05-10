const SequelizeModel = require('./SequelizeModel')

class NftAsset extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        token_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        contract: {
          type: DataTypes.JSONB,
          allowNull: false
        },
        // contract: {
        //   address: DataTypes.STRING(10),
        //   type: DataTypes.STRING(50)
        // },
        name: {
          type: DataTypes.STRING(100)
        },
        symbol: DataTypes.STRING(100),
        collection_uid: DataTypes.STRING(50),
        markets_data: DataTypes.JSONB,
        // last_sale: {
        //   "asset": {
        //       "decimals": 0,
        //       "token_id": "5550"
        //   },
        //   "asset_bundle": null,
        //   "event_type": "successful",
        //   "event_timestamp": "2022-02-12T02:42:24",
        //   "total_price": "4700000000000000000",
        //   "payment_token": {
        //     ...
        //   }
        // },
        // sell_orders: {},
        // orders: {},
        image_data: DataTypes.JSONB,
        // {
        //   "image_url",
        //   "image_preview_url"
        // }
        attributes: DataTypes.JSONB,
        // [
        //   {
        //       "trait_type": "Headgear",
        //       "value": "Ponytail Black",
        //       "display_type": null,
        //       "max_value": null,
        //       "trait_count": 121,
        //       "order": null
        //   }
        // ]
        links: DataTypes.JSONB,
        // {
        //   "external_link": "",
        //   "permalink": ""
        // }
        description: DataTypes.TEXT,
        last_updated: DataTypes.DATE
      },
      {
        timestamps: false,
        tableName: 'nft_assets',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['token_id', 'contract']
        }]
      }
    )
  }

  static upsertAssets(assets) {
    NftAsset.bulkCreate(assets, {
      updateOnDuplicate: ['markets_data', 'last_updated']
    }).then(() => {
      console.log('Assets successfully inserted !!!')
    })
      .catch(err => {
        console.error('Error inserting nft assets', err.message)
      })
  }

  static async getCachedAsset(contractAddress, tokenId) {
    const query = (`
      SELECT *
      FROM nft_assets
      WHERE (contract->>'address') = :contractAddress
            AND token_id = :tokenId
            AND ABS(EXTRACT(epoch FROM (last_updated - now()))::int/60) <= 5
    `)

    const [asset] = await NftAsset.query(query, { contractAddress, tokenId })
    return asset
  }

  static getByContract(contract) {
    return NftAsset.query('SELECT * FROM nft_assets WHERE contract->>\'address\' = :contract', { contract })
  }
}

module.exports = NftAsset
