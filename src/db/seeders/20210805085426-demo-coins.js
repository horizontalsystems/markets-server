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

    await queryInterface.bulkInsert('coin_descriptions', [
      {
        coin_id: 'bitcoin',
        language_id: 'en',
        content: 'Description for Bitcoin'
      },
      {
        coin_id: 'ethereum',
        language_id: 'en',
        content: 'Description for Ethereum'
      },
      {
        coin_id: 'bitcoin',
        language_id: 'ru',
        content: 'Описание для Bitcoin'
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

    await queryInterface.bulkInsert('platforms', [
      {
        id: 'erc20',
        description: 'ERC20 token on Ethereum blockchain'
      },
      {
        id: 'bep20',
        description: 'BEP20 token on Binance Smart Chain'
      },
      {
        id: 'bep2',
        description: 'BEP2 token on Binance Chain'
      },
    ], {})

    await queryInterface.bulkInsert('platform_references', [
      {
        platform_id: 'erc20',
        coin_id: 'tether',
        value: '0xdac17f958d2ee523a2206206994597c13d831ec7'
      },
      {
        platform_id: 'bep20',
        coin_id: 'tether',
        value: '0x55d398326f99059ff775485246999027b3197955'
      },
      {
        platform_id: 'bep20',
        coin_id: 'ethereum',
        value: '0x2170ed0880ac9a755fd29b2688956bd959f933f8'
      },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('coins', null, {})
    await queryInterface.bulkDelete('coin_descriptions', null, {})
    await queryInterface.bulkDelete('languages', null, {})
    await queryInterface.bulkDelete('categories', null, {})
    await queryInterface.bulkDelete('category_descriptions', null, {})
    await queryInterface.bulkDelete('coin_categories', null, {})
    await queryInterface.bulkDelete('platforms', null, {})
    await queryInterface.bulkDelete('platform_references', null, {})
  }
}
