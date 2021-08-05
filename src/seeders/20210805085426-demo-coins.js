module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('coins', [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        code: 'BTC'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        code: 'ETH'
      },
      {
        id: 'tether',
        name: 'Tether',
        code: 'USDT'
      },
    ], {})

    await queryInterface.bulkInsert('languages', [
      {
        id: 'en',
        name: 'English'
      },
      {
        id: 'ru',
        name: 'Russian'
      },
      {
        id: 'de',
        name: 'German'
      },
    ], {})

    await queryInterface.bulkInsert('categories', [
      {
        id: 'dexes',
        name: 'Dexes'
      },
      {
        id: 'blockchains',
        name: 'Blockchains'
      },
      {
        id: 'lending',
        name: 'Lending'
      },
    ], {})

    await queryInterface.bulkInsert('category_descriptions', [
      {
        category_id: 'dexes',
        language_id: 'en',
        content: 'Description for dexes'
      },
      {
        category_id: 'lending',
        language_id: 'en',
        content: 'Description for lending'
      },
      {
        category_id: 'lending',
        language_id: 'ru',
        content: 'Описание для lending'
      },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('coins', null, {})
    await queryInterface.bulkDelete('languages', null, {})
    await queryInterface.bulkDelete('categories', null, {})
  }
}
