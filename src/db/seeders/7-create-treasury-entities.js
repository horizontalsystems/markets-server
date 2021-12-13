const entities = require('./treasury-entities.json')

module.exports = {
  up: async queryInterface => {
    const records = entities.map(item => {
      return {
        uid: item.uid,
        name: item.name,
        type: item.type,
        country: item.country
      }
    })

    await queryInterface.bulkInsert('treasury_entities', records)
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('treasury_entities', null, {})
  }
}
