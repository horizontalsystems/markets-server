const verifiedExchanges = require('./verified-exchanges.json')

module.exports = {
  up: async queryInterface => {
    const records = verifiedExchanges.map(item => {
      return {
        uid: item.uid,
        name: item.name
      }
    })

    await queryInterface.bulkInsert('verified_exchanges', records)
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('verified_exchanges', null, {})
  }
}
