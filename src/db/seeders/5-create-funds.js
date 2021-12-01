const funds = require('./funds.json')

module.exports = {
  up: async queryInterface => {
    const records = funds.map(item => {
      return {
        name: item.name,
        uid: item.uid,
        website: item.website,
        is_individual: item.is_individual
      }
    })

    await queryInterface.bulkInsert('funds', records)
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('funds', null, {})
  }
}
