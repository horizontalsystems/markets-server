module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('categories', [
      { uid: 'blockchains', name: 'Blockchains', description: JSON.stringify({ en: 'Native cryptocurrencies on major blockchains.' }) },
      { uid: 'dexes', name: 'DEXes', description: JSON.stringify({ en: 'Decentralized cryptocurrency exchanges.' }) },
      { uid: 'lending', name: 'Lending', description: JSON.stringify({ en: 'Protocols for lending and borrowing.' }) },
      { uid: 'yield_aggregators', name: 'Yield Aggregators', description: JSON.stringify({ en: 'Solutions for earning from idle crypto assets.' }) },
      { uid: 'gaming', name: 'Gaming', description: JSON.stringify({ en: 'Crypto projects in gaming and VR sector.' }) },
      { uid: 'oracles', name: 'Oracles', description: JSON.stringify({ en: 'Connecting real world data to smart contracts.' }) },
      { uid: 'nft', name: 'NFT', description: JSON.stringify({ en: 'NFT projects.' }) },
      { uid: 'privacy', name: 'Privacy', description: JSON.stringify({ en: 'Projects working on privacy solutions.' }) },
      { uid: 'storage', name: 'Storage', description: JSON.stringify({ en: 'Decentralized data-storage.' }) },
      { uid: 'wallets', name: 'Wallets', description: JSON.stringify({ en: 'Tokens issued by cryptocurrency wallets.' }) },
      { uid: 'identity', name: 'Identity', description: JSON.stringify({ en: 'Decentralized identity.' }) },
      { uid: 'scaling', name: 'Scaling', description: JSON.stringify({ en: 'Solutions for faster blockchain transactions.' }) },
      { uid: 'analytics', name: 'Analytics', description: JSON.stringify({ en: 'Token-powered analytics and investment instruments.' }) },
      { uid: 'yield_tokens', name: 'Yield Tokens', description: JSON.stringify({ en: 'Interesting Bearing Tokens.' }) },
      { uid: 'exchange_tokens', name: 'Exchange Tokens', description: JSON.stringify({ en: 'Tokens issued by centralized exchanges.' }) },
      { uid: 'stablecoins', name: 'Stablecoins', description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to fiat currency.' }) },
      { uid: 'tokenized_bitcoin', name: 'Tokenized Bitcoin', description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to Bitcoin price.' }) },
      { uid: 'risk_management', name: 'Risk Management', description: JSON.stringify({ en: 'Risk assessment, insurance and hedging.' }) },
      { uid: 'synthetics', name: 'Synthetics', description: JSON.stringify({ en: 'Platforms for creating decentralized synthetic assets.' }) },
      { uid: 'index_funds', name: 'Index Funds', description: JSON.stringify({ en: 'Assets that pegged in price to a set of tokens.' }) },
      { uid: 'prediction', name: 'Prediction', description: JSON.stringify({ en: 'Markets to bet on events in the future.' }) },
      { uid: 'fundraising', name: 'Fundraising', description: JSON.stringify({ en: 'Fundraising and token sale platforms.' }) },
      { uid: 'infrastructure', name: 'Infrastructure', description: JSON.stringify({ en: 'Projects building infrastructure solutions.' }) }
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
