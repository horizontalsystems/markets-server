const SequelizeModel = require('./SequelizeModel')

class FundsInvested extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        round: {
          type: DataTypes.ENUM([
            'Secondary Market',
            'Initial Coin Offering',
            'Venture Round',
            'Series A',
            'Seed Round',
            'Angel Round',
            'Series C',
            'Pre-Seed Round',
            'Funding Round',
            'Series B',
            'Series D',
            'Series E',
            'Private Equity Round',
            'Corporate Round',
            'Non Equity Assistance',
            'Convertible Note',
            'Debt Financing',
            'Seed',
            'Grant'
          ]),
          allowNull: false
        },
        amount: DataTypes.DECIMAL,
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        funds: {
          type: DataTypes.JSONB,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'funds_invested',
        sequelize
      }
    )
  }

  static associate(models) {
    FundsInvested.belongsTo(models.Coin)
  }

  static async getByCoin(uid) {
    const query = `
      SELECT
        I.date,
        I.round,
        I.amount,
        I.amount * C.price as amount_usd,
        JSON_AGG(JSON_BUILD_OBJECT(
          'name', F.name,
          'website', F.website,
          'uid', F.uid,
          'is_lead', e.jsn->'is_lead'
        )) as funds
      FROM funds_invested I, coins C
      JOIN LATERAL jsonb_array_elements(I.funds) as e(jsn) ON TRUE
      LEFT JOIN funds F on F.id = (e.jsn->>'id')::int
      WHERE C.id = I.coin_id 
        AND C.uid = :uid
      GROUP BY I.id, C.price
    `

    return FundsInvested.query(query, { uid })
  }

}

module.exports = FundsInvested
