// dump script
// SELECT cat.id, cat.uid, cat.description, json_agg(C.uid)
//   FROM categories cat, coin_categories M, coins C
//  WHERE M.category_id = cat.id
//    AND M.coin_id = C.id
//  GROUP BY cat.id
//  ORDER BY cat.id
const categories = [
  { uid: 'blockchains', name: 'Blockchains', coins: ['ethereum', 'solana', 'fantom', 'polkadot', 'tezos', 'litecoin', 'waves', 'ethereum-classic', 'monero', 'neo', 'ripple', 'cardano', 'tron', 'icon', 'iostoken', 'stellar', 'harmony', 'qtum', 'avalanche-2', 'iota', 'binancecoin', 'algorand', 'dash', 'near', 'bitcoin', 'decred', 'bitcoin-cash', 'zcash', 'cosmos', 'eos', 'ontology', 'zilliqa', 'nem', 'internet-computer'], description: JSON.stringify({ en: 'Native cryptocurrencies on major blockchains.' }) },
  { uid: 'dexes', name: 'DEXes', coins: ['polkadex', 'derivadao', 'raydium', 'havven', 'ellipsis', 'pangolin', 'thorchain', 'sushi', 'dodo', 'mdex', '0x', 'orca', 'anyswap', 'serum', 'quick', 'curve-dao-token', 'loopring', '1inch', 'perpetual-protocol', 'balancer', 'aurora-dao', 'zkswap', 'joe', 'pancakeswap-token', 'injective-protocol', 'bancor', 'mcdex', 'airswap', 'uniswap'], description: JSON.stringify({ en: 'Decentralized cryptocurrency exchanges.' }) },
  { uid: 'lending', name: 'Lending', coins: ['liquity', 'mainframe', 'dforce-token', 'aave', 'alpaca-finance', 'alchemix', 'oxygen', 'maker', 'celsius-degree-token', 'anchor-protocol', 'cream-2', 'venus', 'truefi', 'bzx-protocol', 'kava', 'force-protocol', 'compound-governance-token'], description: JSON.stringify({ en: 'Protocols for lending and borrowing.' }) },
  { uid: 'yield_aggregators', name: 'Yield Aggregators', coins: ['auto', 'badger-dao', 'pickle-finance', '88mph', 'vesper-finance', 'solfarm', 'alpaca-finance', 'harvest-finance', 'alpha-finance', 'yfii-finance', 'value-liquidity', 'beefy-finance', 'rari-governance-token', 'bella-protocol', 'akropolis', 'yearn-finance', 'convex-finance'], description: JSON.stringify({ en: 'Solutions for earning from idle crypto assets.' }) },
  { uid: 'gaming', name: 'Gaming', coins: ['my-neighbor-alice', 'enjincoin', 'ovr', 'yield-guild-games', 'aavegotchi', 'star-atlas', 'smooth-love-potion', 'gala', 'axie-infinity', 'revv', 'decentral-games', 'the-sandbox', 'illuvium', 'ultra', 'decentraland', 'chain-games', 'crowns'], description: JSON.stringify({ en: 'Crypto projects in gaming and VR sector.' }) },
  { uid: 'oracles', name: 'Oracles', coins: ['nest', 'berry-data', 'razor-network', 'chainlink', 'umbrella-network', 'kylin-network', 'band-protocol', 'tellor', 'wink', 'dia-data', 'api3'], description: JSON.stringify({ en: 'Connecting real world data to smart contracts.' }) },
  { uid: 'nft', name: 'NFT', coins: ['ethernity-chain', 'whale', 'wax', 'superfarm', 'dego-finance', 'alien-worlds', 'terra-virtua-kolect', 'flow', 'auction', 'rarible', 'jenny-metaverse-dao-token', 'nftx', 'bondly', 'refinable'], description: JSON.stringify({ en: 'NFT projects.' }) },
  { uid: 'privacy', name: 'Privacy', coins: ['ocean-protocol', 'sentinel', 'secret', 'verge', 'monero', 'grin', 'keep-network', 'zencash', 'haven', 'tornado-cash', 'zcoin', 'orchid-protocol', 'oasis-network', 'nucypher', 'dash', 'hopr', 'zcash', 'pirate-chain', 'dusk-network'], description: JSON.stringify({ en: 'Projects working on privacy solutions.' }) },
  { uid: 'storage', name: 'Storage', coins: ['siacoin', 'bluzelle', 'crust-network', 'arweave', 'storj', 'filecoin', 'holotoken', 'prometeus', 'bittorrent-2'], description: JSON.stringify({ en: 'Decentralized data-storage.' }) },
  { uid: 'wallets', name: 'Wallets', coins: ['trust-wallet-token', 'status', 'safepal', 'math', 'crypto-com-chain', 'gnosis', 'swissborg', 'oxygen', 'nexo', 'pundi-x-2'], description: JSON.stringify({ en: 'Tokens issued by cryptocurrency wallets.' }) },
  { uid: 'identity', name: 'Identity', coins: ['selfkey', 'fio-protocol', 'civic', 'carry', 'litentry', 'metadium'], description: JSON.stringify({ en: 'Decentralized identity.' }) },
  { uid: 'scaling', name: 'Scaling', coins: ['hermez-network-token', 'skale', 'elrond-erd-2', 'xdai-stake', 'matic-network', 'celer-network', 'harmony', 'loopring', 'omisego'], description: JSON.stringify({ en: 'Solutions for faster blockchain transactions.' }) },
  { uid: 'analytics', name: 'Analytics', coins: ['santiment-network-token', 'graphlinq-protocol', 'parsiq', 'step-finance', 'dextools', 'uniwhales', 'big-data-protocol', 'yieldwatch'], description: JSON.stringify({ en: 'Token-powered analytics and investment instruments.' }) },
  { uid: 'yield_tokens', name: 'Yield Tokens', coins: ['compound-wrapped-btc', 'compound-usdt', 'compound-ether', 'xsushi', 'cdai', 'compound-uniswap', 'aave-mkr-v1', 'compound-usd-coin'], description: JSON.stringify({ en: 'Interesting Bearing Tokens.' }) },
  { uid: 'exchange_tokens', name: 'Exchange Tokens', coins: ['zb-token', 'leo-token', 'ftx-token', 'crypto-com-chain', 'zipmex-token', 'gatechain-token', 'orion-protocol', 'huobi-token', 'binancecoin', 'wazirx', 'woo-network', 'okb', 'mx-token', 'kucoin-shares', 'tokocrypto'], description: JSON.stringify({ en: 'Tokens issued by centralized exchanges.' }) },
  { uid: 'stablecoins', name: 'Stablecoins', coins: ['vai', 'tether-eurt', 'nusd', 'tether', 'celo-dollar', 'frax', 'terrausd', 'fei-protocol', 'usd-coin', 'magic-internet-money', 'alchemix-usd', 'dai', 'paxos-standard', 'binance-usd', 'usdk', 'husd', 'true-usd', 'liquity-usd', 'gemini-dollar', 'neutrino'], description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to fiat currency.' }) },
  { uid: 'tokenized_bitcoin', name: 'Tokenized Bitcoin', coins: ['renbtc', 'sbtc', 'wrapped-bitcoin', 'ptokens-btc', 'tbtc', 'huobi-btc'], description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to Bitcoin price.' }) },
  { uid: 'risk_management', name: 'Risk Management', coins: ['dhedge-dao', 'melon', 'nsure-network', 'ribbon-finance', 'hedget', 'wrapped-nxm', 'barnbridge', 'saffron-finance', 'insurace', 'nxm', 'stafi', 'armor'], description: JSON.stringify({ en: 'Risk assessment, insurance and hedging.' }) },
  { uid: 'synthetics', name: 'Synthetics', coins: ['mirror-protocol', 'havven', 'alchemix', 'uma', 'stp-network', 'terra-luna'], description: JSON.stringify({ en: 'Platforms for creating decentralized synthetic assets.' }) },
  { uid: 'index_funds', name: 'Index Funds', coins: ['degen-index', 'cryptocurrency-top-10-tokens-index', 'defipulse-index', 'btc-2x-flexible-leverage-index', 'piedao-defi-large-cap', 'basketdao-defi-index', 'defi-top-5-tokens-index', 'power-index-pool-token', 'eth-2x-flexible-leverage-index'], description: JSON.stringify({ en: 'Assets that pegged in price to a set of tokens.' }) },
  { uid: 'prediction', name: 'Prediction', coins: ['plotx', 'gnosis', 'polkamarkets', 'augur', 'prosper'], description: JSON.stringify({ en: 'Markets to bet on events in the future.' }) },
  { uid: 'fundraising', name: 'Fundraising', coins: ['trustswap', 'occamfi', 'duckdaodime', 'cardstarter', 'poolz-finance', 'dao-maker', 'polkastarter'], description: JSON.stringify({ en: 'Fundraising and token sale platforms.' }) },
  { uid: 'infrastructure', name: 'Infrastructure', coins: ['wanchain', 'origin-protocol', 'bonfida', 'ankr', 'republic-protocol', 'keep3rv1', 'radicle', 'dora-factory', 'mxc', 'blockstack', 'the-graph', 'allianceblock', 'strong', 'kusama', 'contentos', 'aelf', 'nervos-network', 'lisk'], description: JSON.stringify({ en: 'Projects building infrastructure solutions.' }) }
]

module.exports = {
  up: async queryInterface => {
    const categoryRecords = []
    const categoryMap = {}

    categories.forEach(({ coins, ...category }) => {
      categoryMap[category.uid] = { coins }
      categoryRecords.push(category)
    })

    await queryInterface.bulkInsert('categories', categoryRecords, {})
    const categoryIds = await queryInterface.sequelize.query('select id, uid from categories', {
      type: queryInterface.sequelize.QueryTypes.SELECT
    })

    categoryIds.forEach(category => {
      categoryMap[category.uid].categoryId = category.id
    })

    const categoryCoins = Object.values(categoryMap)
    const query = (`
      INSERT INTO coin_categories(coin_id, category_id)
      SELECT id as coin_id, :categoryId as category_id FROM coins
      where uid IN (:coins)
    `)

    for (let i = 0; i < categoryCoins.length; i += 1) {
      const { categoryId, coins } = categoryCoins[i];

      await queryInterface.sequelize.query(query, {
        replacements: { categoryId, coins }
      })
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', null, {})
    await queryInterface.bulkDelete('coin_categories', null, {})
  }
}
