const funds = require('./funds.json')

module.exports = {
  up: async queryInterface => {
    const records = funds.map(item => {
      return {
        uid: item.uid,
        name: item.name
      }
    })

    await queryInterface.bulkInsert('exchanges', records)
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('exchanges', null, {})
  }
}
