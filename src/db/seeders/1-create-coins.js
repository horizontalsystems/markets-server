module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('coins', [
      { id: 1, uid: 'bitcoin', name: 'Bitcoin', code: 'BTC', coingecko_id: 'bitcoin' },
      { id: 2, uid: 'ethereum', name: 'Ethereum', code: 'ETH', coingecko_id: 'ethereum' },
      { id: 3, uid: 'cardano', name: 'Cardano', code: 'ADA', coingecko_id: 'cardano' },
      { id: 4, uid: 'tether', name: 'Tether', code: 'USDT', coingecko_id: 'tether' },
      { id: 5, uid: 'bitcoin-cash', name: 'Bitcoin Cash', code: 'BCH', coingecko_id: 'bitcoin-cash' },
      { id: 6, uid: 'litecoin', name: 'Litecoin', code: 'LTC', coingecko_id: 'litecoin' },
      { id: 7, uid: 'dash', name: 'Dash', code: 'DASH', coingecko_id: 'dash' },
      { id: 8, uid: 'zcash', name: 'Zcash', code: 'ZEC', coingecko_id: 'zcash' },
      { id: 9, uid: 'binancecoin', name: 'Binance Coin', code: 'BNB', coingecko_id: 'binancecoin' },
      { id: 10, uid: 'trust-wallet-token', name: 'Trust Wallet', code: 'TWT', coingecko_id: 'trust-wallet-token' }
    ], {})

    await queryInterface.bulkInsert('platforms', [
      { coin_id: 1, type: 'bitcoin', decimals: 8 },
      { coin_id: 2, type: 'ethereum', decimals: 18 },
      { coin_id: 2, type: 'bep20', decimals: 18, address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8' },
      { coin_id: 3, type: 'cardano', decimals: 6 },
      { coin_id: 4, type: 'erc20', decimals: 6, address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
      { coin_id: 4, type: 'bep20', decimals: 18, address: '0x55d398326f99059ff775485246999027b3197955' },
      { coin_id: 4, type: 'sol20', decimals: 18, address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
      { coin_id: 5, type: 'bitcoin-cash', decimals: 8 },
      { coin_id: 6, type: 'litecoin', decimals: 8 },
      { coin_id: 7, type: 'dash', decimals: 8 },
      { coin_id: 8, type: 'zcash', decimals: 8 },
      { coin_id: 9, type: 'binance-smart-chain', decimals: 18 },
      { coin_id: 9, type: 'bep2', decimals: 8, symbol: 'BNB' },
      { coin_id: 10, type: 'bep20', decimals: 18, address: '0x4b0f1812e5df2a09796481ff14017e6005508003' },
      { coin_id: 10, type: 'bep2', decimals: 8, symbol: 'TWT-8C2' },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('coins', null, {})
    await queryInterface.bulkDelete('platforms', null, {})
  }
}
