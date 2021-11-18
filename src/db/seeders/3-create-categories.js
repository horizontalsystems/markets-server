// dump script
// SELECT cat.id, cat.uid, cat.description, json_agg(C.uid ORDER BY C.uid)
//   FROM categories cat, coin_categories M, coins C
//  WHERE M.category_id = cat.id
//    AND M.coin_id = C.id
//  GROUP BY cat.id
//  ORDER BY cat.id

const categories = [
  { uid: 'blockchains', name: 'Blockchains', coins: ['algorand', 'avalanche-2', 'binancecoin', 'bitcoin', 'bitcoin-cash', 'cardano', 'cosmos', 'dash', 'decred', 'eos', 'ethereum', 'ethereum-classic', 'fantom', 'harmony', 'icon', 'internet-computer', 'iostoken', 'iota', 'litecoin', 'monero', 'near', 'nem', 'neo', 'ontology', 'polkadot', 'qtum', 'ripple', 'solana', 'stellar', 'tezos', 'tron', 'waves', 'zcash', 'zilliqa'], description: JSON.stringify({ en: 'Native cryptocurrencies on major blockchains.' }) },
  { uid: 'dexes', name: 'DEXes', coins: ['0x', '1inch', 'airswap', 'anyswap', 'aurora-dao', 'balancer', 'bancor', 'curve-dao-token', 'derivadao', 'dodo', 'ellipsis', 'havven', 'injective-protocol', 'joe', 'loopring', 'mcdex', 'mdex', 'orca', 'pancakeswap-token', 'pangolin', 'perpetual-protocol', 'polkadex', 'quick', 'raydium', 'serum', 'sushi', 'thorchain', 'uniswap', 'zkswap'], description: JSON.stringify({ en: 'Decentralized cryptocurrency exchanges.' }) },
  { uid: 'lending', name: 'Lending', coins: ['aave', 'alchemix', 'alpaca-finance', 'anchor-protocol', 'bzx-protocol', 'celsius-degree-token', 'compound-governance-token', 'cream-2', 'dforce-token', 'force-protocol', 'kava', 'liquity', 'mainframe', 'maker', 'oxygen', 'spell-token', 'truefi', 'venus'], description: JSON.stringify({ en: 'Protocols for lending and borrowing.' }) },
  { uid: 'yield_aggregators', name: 'Yield Aggregators', coins: ['88mph', 'akropolis', 'alpaca-finance', 'alpha-finance', 'auto', 'badger-dao', 'beefy-finance', 'bella-protocol', 'convex-finance', 'harvest-finance', 'pickle-finance', 'rari-governance-token', 'solfarm', 'value-liquidity', 'vesper-finance', 'yearn-finance', 'yfii-finance'], description: JSON.stringify({ en: 'Solutions for earning from idle crypto assets.' }) },
  { uid: 'gaming', name: 'Gaming', coins: ['aavegotchi', 'axie-infinity', 'chain-games', 'crowns', 'decentral-games', 'decentraland', 'enjincoin', 'gala', 'illuvium', 'my-neighbor-alice', 'ovr', 'revv', 'smooth-love-potion', 'star-atlas', 'the-sandbox', 'ultra', 'yield-guild-games'], description: JSON.stringify({ en: 'Crypto projects in gaming and VR sector.' }) },
  { uid: 'oracles', name: 'Oracles', coins: ['api3', 'band-protocol', 'berry-data', 'chainlink', 'dia-data', 'kylin-network', 'nest', 'razor-network', 'tellor', 'umbrella-network', 'wink'], description: JSON.stringify({ en: 'Connecting real world data to smart contracts.' }) },
  { uid: 'nft', name: 'NFT', coins: ['alien-worlds', 'auction', 'bondly', 'dego-finance', 'ethernity-chain', 'flow', 'jenny-metaverse-dao-token', 'nftx', 'rarible', 'refinable', 'superfarm', 'terra-virtua-kolect', 'wax', 'whale'], description: JSON.stringify({ en: 'NFT projects.' }) },
  { uid: 'privacy', name: 'Privacy', coins: ['dash', 'dusk-network', 'grin', 'haven', 'hopr', 'keep-network', 'monero', 'nucypher', 'oasis-network', 'ocean-protocol', 'orchid-protocol', 'pirate-chain', 'secret', 'sentinel', 'tornado-cash', 'verge', 'zcash', 'zcoin', 'zencash'], description: JSON.stringify({ en: 'Projects working on privacy solutions.' }) },
  { uid: 'storage', name: 'Storage', coins: ['arweave', 'bittorrent-2', 'bluzelle', 'crust-network', 'filecoin', 'holotoken', 'prometeus', 'siacoin', 'storj'], description: JSON.stringify({ en: 'Decentralized data-storage.' }) },
  { uid: 'wallets', name: 'Wallets', coins: ['crypto-com-chain', 'gnosis', 'math', 'nexo', 'oxygen', 'pundi-x-2', 'safepal', 'status', 'swissborg', 'trust-wallet-token'], description: JSON.stringify({ en: 'Tokens issued by cryptocurrency wallets.' }) },
  { uid: 'identity', name: 'Identity', coins: ['carry', 'civic', 'fio-protocol', 'litentry', 'metadium', 'selfkey'], description: JSON.stringify({ en: 'Decentralized identity.' }) },
  { uid: 'scaling', name: 'Scaling', coins: ['celer-network', 'elrond-erd-2', 'harmony', 'hermez-network-token', 'loopring', 'matic-network', 'omisego', 'skale', 'xdai-stake'], description: JSON.stringify({ en: 'Solutions for faster blockchain transactions.' }) },
  { uid: 'analytics', name: 'Analytics', coins: ['big-data-protocol', 'dextools', 'graphlinq-protocol', 'parsiq', 'santiment-network-token', 'step-finance', 'uniwhales', 'yieldwatch'], description: JSON.stringify({ en: 'Token-powered analytics and investment instruments.' }) },
  { uid: 'yield_tokens', name: 'Yield Tokens', coins: ['cdai', 'compound-ether', 'compound-uniswap', 'compound-usd-coin', 'compound-usdt', 'compound-wrapped-btc', 'xsushi'], description: JSON.stringify({ en: 'Interesting Bearing Tokens.' }) },
  { uid: 'exchange_tokens', name: 'Exchange Tokens', coins: ['binancecoin', 'crypto-com-chain', 'ftx-token', 'gatechain-token', 'huobi-token', 'kucoin-shares', 'leo-token', 'mx-token', 'okb', 'orion-protocol', 'tokocrypto', 'wazirx', 'woo-network', 'zb-token', 'zipmex-token'], description: JSON.stringify({ en: 'Tokens issued by centralized exchanges.' }) },
  { uid: 'stablecoins', name: 'Stablecoins', coins: ['alchemix-usd', 'binance-usd', 'celo-dollar', 'dai', 'fei-protocol', 'frax', 'gemini-dollar', 'husd', 'liquity-usd', 'magic-internet-money', 'neutrino', 'nusd', 'paxos-standard', 'terrausd', 'tether', 'tether-eurt', 'true-usd', 'usd-coin', 'usdk', 'vai'], description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to fiat currency.' }) },
  { uid: 'tokenized_bitcoin', name: 'Tokenized Bitcoin', coins: ['huobi-btc', 'ptokens-btc', 'renbtc', 'sbtc', 'tbtc', 'wrapped-bitcoin'], description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to Bitcoin price.' }) },
  { uid: 'risk_management', name: 'Risk Management', coins: ['armor', 'barnbridge', 'dhedge-dao', 'hedget', 'insurace', 'melon', 'nsure-network', 'nxm', 'ribbon-finance', 'saffron-finance', 'stafi', 'wrapped-nxm'], description: JSON.stringify({ en: 'Risk assessment, insurance and hedging.' }) },
  { uid: 'synthetics', name: 'Synthetics', coins: ['alchemix', 'havven', 'mirror-protocol', 'stp-network', 'terra-luna', 'uma'], description: JSON.stringify({ en: 'Platforms for creating decentralized synthetic assets.' }) },
  { uid: 'index_funds', name: 'Index Funds', coins: ['basketdao-defi-index', 'btc-2x-flexible-leverage-index', 'cryptocurrency-top-10-tokens-index', 'defi-top-5-tokens-index', 'defipulse-index', 'degen-index', 'eth-2x-flexible-leverage-index', 'piedao-defi-large-cap', 'power-index-pool-token'], description: JSON.stringify({ en: 'Assets that pegged in price to a set of tokens.' }) },
  { uid: 'prediction', name: 'Prediction', coins: ['augur', 'gnosis', 'plotx', 'polkamarkets', 'prosper'], description: JSON.stringify({ en: 'Markets to bet on events in the future.' }) },
  { uid: 'fundraising', name: 'Fundraising', coins: ['cardstarter', 'dao-maker', 'duckdaodime', 'occamfi', 'polkastarter', 'poolz-finance', 'trustswap'], description: JSON.stringify({ en: 'Fundraising and token sale platforms.' }) },
  { uid: 'infrastructure', name: 'Infrastructure', coins: ['aelf', 'allianceblock', 'ankr', 'blockstack', 'bonfida', 'contentos', 'dora-factory', 'keep3rv1', 'kusama', 'lisk', 'mxc', 'nervos-network', 'origin-protocol', 'radicle', 'republic-protocol', 'strong', 'the-graph', 'wanchain'], description: JSON.stringify({ en: 'Projects building infrastructure solutions.' }) },
  { uid: 'liquidity_manager', name: 'Infrastructure', coins: ['tokemak'], description: JSON.stringify({ de: 'Liquidity Manager', en: 'Liquidity Manager', es: 'Liquidity Manager', fa: 'Liquidity Manager', fr: 'Liquidity Manager', ko: 'Liquidity Manager', ru: 'Liquidity Manager', tr: 'Liquidity Manager', zh: 'Liquidity Manager' }) },
  { uid: 'reserve_currency', name: 'Infrastructure', coins: ['invictus-capital-token', 'olympus', 'wonderland'], description: JSON.stringify({ de: 'Reserve Currency', en: 'Reserve Currency', es: 'Reserve Currency', fa: 'Reserve Currency', fr: 'Reserve Currency', ko: 'Reserve Currency', ru: 'Reserve Currency', tr: 'Reserve Currency', zh: 'Reserve Currency' }) }
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
