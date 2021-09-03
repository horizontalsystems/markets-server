module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('coins', [
      { id: 1, uid: 'bitcoin', name: 'Bitcoin', code: 'BTC', market_cap_rank: 1, coingecko_id: 'bitcoin', privacy: 'medium', decentralized: true },
      { id: 2, uid: 'ethereum', name: 'Ethereum', code: 'ETH', market_cap_rank: 2, coingecko_id: 'ethereum' },
      { id: 3, uid: 'cardano', name: 'Cardano', code: 'ADA', market_cap_rank: 3, coingecko_id: 'cardano' },
      { id: 4, uid: 'tether', name: 'Tether', code: 'USDT', market_cap_rank: 5, coingecko_id: 'tether' },
    ], {})

    await queryInterface.bulkInsert('languages', [
      { id: 1, code: 'en', name: 'English' },
      { id: 2, code: 'ru', name: 'Russian' },
      { id: 3, code: 'de', name: 'German' },
    ], {})

    await queryInterface.bulkInsert('coin_descriptions', [
      { coin_id: 1, language_id: 1, content: 'Description for Bitcoin' },
      { coin_id: 2, language_id: 1, content: 'Description for Ethereum' },
      { coin_id: 1, language_id: 2, content: 'Описание для Bitcoin' },
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

    await queryInterface.bulkInsert('platforms', [
      { coin_id: 1, type: 'bitcoin', decimal: 8 },
      { coin_id: 2, type: 'ethereum', decimal: 18 },
      { coin_id: 2, type: 'bep20', decimal: 18, reference: '0x2170ed0880ac9a755fd29b2688956bd959f933f8' },
      { coin_id: 3, type: 'cardano', decimal: 6 },
      { coin_id: 4, type: 'erc20', decimal: 6, reference: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
      { coin_id: 4, type: 'bep20', decimal: 18, reference: '0x55d398326f99059ff775485246999027b3197955' },
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
  }
}
