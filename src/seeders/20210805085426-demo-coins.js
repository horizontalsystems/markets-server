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
        code: 'USDT',
        erc20_contract_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        bep20_contract_address: '0x55d398326f99059ff775485246999027b3197955'
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

    await queryInterface.bulkInsert('coin_categories', [
      {
        coin_id: 'bitcoin',
        category_id: 'blockchains'
      },
      {
        coin_id: 'bitcoin',
        category_id: 'dexes'
      },
      {
        coin_id: 'ethereum',
        category_id: 'dexes'
      },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('coins', null, {})
    await queryInterface.bulkDelete('languages', null, {})
    await queryInterface.bulkDelete('categories', null, {})
    await queryInterface.bulkDelete('category_descriptions', null, {})
    await queryInterface.bulkDelete('coin_categories', null, {})
  }
}
