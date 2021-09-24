module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('categories', [
      { id: 1, uid: 'dexes', name: 'Dexes', description: JSON.stringify({ en: 'Description for dexes' }) },
      { id: 2, uid: 'blockchains', name: 'Blockchains', description: JSON.stringify({ en: 'Blockchains' }) },
      { id: 3, uid: 'lending', name: 'Lending' },
    ], {})

    await queryInterface.bulkInsert('coin_categories', [
      { coin_id: 1, category_id: 2 },
      { coin_id: 1, category_id: 1 },
      { coin_id: 2, category_id: 1 },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', null, {})
    await queryInterface.bulkDelete('coin_categories', null, {})
  }
}
