module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('languages', [
      { id: 1, code: 'en', name: 'English' },
      { id: 2, code: 'ru', name: 'Russian' },
      { id: 3, code: 'de', name: 'German' },
    ], {})

    await queryInterface.bulkInsert('categories', [
      { id: 1, uid: 'dexes', name: 'Dexes' },
      { id: 2, uid: 'blockchains', name: 'Blockchains' },
      { id: 3, uid: 'lending', name: 'Lending' },
    ], {})

    await queryInterface.bulkInsert('category_descriptions', [
      { category_id: 1, language_id: 1, content: 'Description for dexes' },
      { category_id: 3, language_id: 1, content: 'Description for lending' },
      { category_id: 3, language_id: 2, content: 'Описание для lending' },
    ], {})

    await queryInterface.bulkInsert('coin_categories', [
      { coin_id: 1, category_id: 2 },
      { coin_id: 1, category_id: 1 },
      { coin_id: 2, category_id: 1 },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('languages', null, {})
    await queryInterface.bulkDelete('categories', null, {})
    await queryInterface.bulkDelete('coin_descriptions', null, {})
    await queryInterface.bulkDelete('category_descriptions', null, {})
  }
}
