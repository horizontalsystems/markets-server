module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('coins', [
      { id: 1, uid: 'bitcoin', name: 'Bitcoin', code: 'BTC', market_cap_rank: 1, coingecko_id: 'bitcoin', privacy: 'medium', decentralized: true },
      { id: 2, uid: 'ethereum', name: 'Ethereum', code: 'ETH', market_cap_rank: 2, coingecko_id: 'ethereum' },
      { id: 3, uid: 'cardano', name: 'Cardano', code: 'ADA', market_cap_rank: 3, coingecko_id: 'cardano' },
      { id: 4, uid: 'tether', name: 'Tether', code: 'USDT', market_cap_rank: 5, coingecko_id: 'tether' },
      { id: 5, uid: 'bitcoin-cash', name: 'Bitcoin Cash', code: 'BCH', market_cap_rank: 14, coingecko_id: 'bitcoin-cash' },
      { id: 6, uid: 'litecoin', name: 'Litecoin', code: 'LTC', market_cap_rank: 12, coingecko_id: 'litecoin' },
      { id: 7, uid: 'dash', name: 'Dash', code: 'DASH', market_cap_rank: 67, coingecko_id: 'dash' },
      { id: 8, uid: 'zcash', name: 'Zcash', code: 'ZEC', market_cap_rank: 79, coingecko_id: 'zcash' },
      { id: 9, uid: 'binance', name: 'Binance Coin', code: 'BNB', market_cap_rank: 4, coingecko_id: 'binancecoin' },
      { id: 10, uid: 'trust-wallet-token', name: 'Trust Wallet', code: 'TWT', market_cap_rank: 161, coingecko_id: 'trust-wallet-token' },
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
      { coin_id: 4, type: 'sol20', decimal: 18, reference: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
      { coin_id: 5, type: 'bitcoin-cash', decimal: 8 },
      { coin_id: 6, type: 'litecoin', decimal: 8 },
      { coin_id: 7, type: 'dash', decimal: 8 },
      { coin_id: 8, type: 'zcash', decimal: 8 },
      { coin_id: 9, type: 'binance-smart-chain', decimal: 18 },
      { coin_id: 9, type: 'bep2', decimal: 8, reference: 'BNB' },
      { coin_id: 10, type: 'bep20', decimal: 18, reference: '0x4b0f1812e5df2a09796481ff14017e6005508003' },
      { coin_id: 10, type: 'bep2', decimal: 8, reference: 'TWT-8C2' },
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
