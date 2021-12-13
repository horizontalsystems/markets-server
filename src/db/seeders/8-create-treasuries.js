const treasuries = require('./treasuries.json')

module.exports = {
  up: async queryInterface => {
    const entities = await queryInterface.sequelize.query('select id, uid from treasury_entities', {
      type: queryInterface.sequelize.QueryTypes.SELECT
    })

    const entityIds = entities.reduce((result, item) => ({ ...result, [item.uid]: item.id }), {})
    const records = treasuries
      .map(item => {
        return ({
          amount: item.amount,
          treasury_entity_id: entityIds[item.treasury],
          coin_id: item.coin_id
        })
      })
      .filter(item => item.treasury_entity_id)

    await queryInterface.bulkInsert('treasuries', records)
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('treasuries', null, {})
  }
}
