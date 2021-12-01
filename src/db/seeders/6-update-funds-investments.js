const fundsInvestments = require('./funds-investments.json')

module.exports = {
  up: async queryInterface => {
    const uids = fundsInvestments.map(item => item.coin_uid)
    const coins = await queryInterface.sequelize.query('select id, uid from coins where uid in (:uids)', {
      replacements: { uids },
      type: queryInterface.sequelize.QueryTypes.SELECT
    })

    const funds = await queryInterface.sequelize.query('select id, uid from funds', {
      type: queryInterface.sequelize.QueryTypes.SELECT
    })

    const coinIds = coins.reduce((result, item) => ({ ...result, [item.uid]: item.id }), {})
    const fundIds = funds.reduce((result, item) => ({ ...result, [item.uid]: item.id }), {})
    const records = []

    for (let i = 0; i < fundsInvestments.length; i += 1) {
      const coinInvestment = fundsInvestments[i]
      const coinId = coinIds[coinInvestment.coin_uid]
      if (coinId) {
        const mapFunds = items => {
          return items.map(fund => {
            return {
              is_lead: fund.is_lead,
              id: fundIds[fund.uid]
            }
          }).filter(fund => fund.id)
        }

        records.push(
          coinInvestment.investments.map(item => {
            let { round } = item
            if (round === 'Pre Seed Round' || round === 'Pre-Seed') {
              round = 'Pre-Seed Round'
            } else if (round === 'Seed') {
              round = 'Seed Round'
            }

            return {
              round,
              coin_id: coinId,
              date: item.date,
              amount: item.amount,
              funds: JSON.stringify(mapFunds(item.funds))
            }
          })
        )
      }
    }

    await queryInterface.bulkInsert('funds_invested', records.flatMap(item => item))
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('funds', null, {})
  }
}
