module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('coins', [
      { id: 1, uid: 'bitcoin', name: 'Bitcoin', code: 'btc', coingecko_id: 'bitcoin' },
      { id: 2, uid: 'ethereum', name: 'Ethereum', code: 'eth', coingecko_id: 'ethereum' },
      { id: 3, uid: 'bitcoin-cash', name: 'Bitcoin Cash', code: 'bch', coingecko_id: 'bitcoin-cash' },
      { id: 4, uid: 'litecoin', name: 'Litecoin', code: 'ltc', coingecko_id: 'litecoin' },
      { id: 5, uid: 'dash', name: 'Dash', code: 'dash', coingecko_id: 'dash' },
      { id: 6, uid: 'zcash', name: 'Zcash', code: 'zec', coingecko_id: 'zcash' },
      { id: 7, uid: 'binancecoin', name: 'Binance Coin', code: 'bnb', coingecko_id: 'binancecoin' }
    ], {})

    await queryInterface.bulkInsert('platforms', [
      { coin_id: 1, type: 'bitcoin', decimals: 8 },
      { coin_id: 2, type: 'ethereum', decimals: 18 },
      { coin_id: 3, type: 'bitcoin-cash', decimals: 8 },
      { coin_id: 4, type: 'litecoin', decimals: 8 },
      { coin_id: 5, type: 'dash', decimals: 8 },
      { coin_id: 6, type: 'zcash', decimals: 8 },
      { coin_id: 7, type: 'binance-smart-chain', decimals: 18 },
      { coin_id: 7, type: 'bep2', decimals: 18 },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('coins', null, {})
    await queryInterface.bulkDelete('platforms', null, {})
  }
}
