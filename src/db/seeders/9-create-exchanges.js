const exchanges = require('./exchanges.json')

module.exports = {
  up: async queryInterface => {
    const records = exchanges.map(item => {
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
