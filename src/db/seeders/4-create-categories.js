const categories = [
  { id: 1, uid: 'blockchains', name: 'Blockchains', coins: ['bitcoin', 'ethereum', 'bitcoin-cash', 'litecoin', 'dash', 'zcash', 'monero', 'polkadot', 'cardano', 'tron', 'avalanche-2', 'ripple', 'algorand', 'solana', 'cosmos', 'neo', 'near', 'nem', 'stellar', 'iota', 'icon', 'qtum', 'tezos', 'waves', 'ontology', 'decred', 'iostoken', 'harmony', 'binancecoin', 'eos', 'internet-computer', 'zilliqa', 'fantom', 'ethereum-classic'], description: JSON.stringify({ en: 'Native cryptocurrencies on major blockchains.' }) },
  { id: 2, uid: 'dexes', name: 'DEXes', coins: ['uniswap', 'sushi', 'curve-dao-token', 'balancer', '1inch', 'havven', 'pancakeswap-token', 'serum', 'thorchain', 'raydium', 'injective-protocol', 'mdex', 'ellipsis', '0x', 'bancor', 'loopring', 'perpetual-protocol', 'mcdex', 'aurora-dao', 'airswap', 'dodo', 'pangolin', 'anyswap', 'quick', 'polkadex', 'joe', 'derivadao', 'orca', 'zkswap'], description: JSON.stringify({ en: 'Decentralized cryptocurrency exchanges.' }) },
  { id: 3, uid: 'lending', name: 'Lending', coins: ['maker', 'compound-governance-token', 'aave', 'bzx-protocol', 'alpaca-finance', 'cream-2', 'force-protocol', 'kava', 'mainframe', 'truefi', 'celsius-degree-token', 'dforce-token', 'alchemix', 'venus', 'liquity', 'oxygen', 'anchor-protocol'], description: JSON.stringify({ en: 'Protocols for lending and borrowing.' }) },
  { id: 4, uid: 'yield_aggregators', name: 'Yield Aggregators', coins: ['yearn-finance', 'badger-dao', 'beefy-finance', 'harvest-finance', 'pickle-finance', 'yfii-finance', 'alpha-finance', '88mph', 'rari-governance-token', 'vesper-finance', 'akropolis', 'bella-protocol', 'auto', 'value-liquidity', 'alpaca-finance', 'convex-finance', 'solfarm', 'yield-yak'], description: JSON.stringify({ en: 'Solutions for earning from idle crypto assets.' }) },
  { id: 5, uid: 'gaming', name: 'Gaming', coins: ['ovr', 'crowns', 'gala', 'revv', 'decentral-games', 'axie-infinity', 'decentraland', 'enjincoin', 'the-sandbox', 'chain-games', 'ultra', 'my-neighbor-alice', 'yield-guild-games', 'illuvium', 'smooth-love-potion', 'star-atlas', 'aavegotchi'], description: JSON.stringify({ en: 'Crypto projects in gaming and VR sector.' }) },
  { id: 6, uid: 'oracles', name: 'Oracles', coins: ['chainlink', 'wink', 'umbrella-network', 'berry-data', 'kylin-network', 'razor-network', 'tellor', 'nest', 'dia-data', 'band-protocol', 'api3'], description: JSON.stringify({ en: 'Connecting real world data to smart contracts.' }) },
  { id: 7, uid: 'nft', name: 'NFT', coins: ['dego-finance', 'rarible', 'bondly', 'ethernity-chain', 'terra-virtua-kolect', 'flow', 'whale', 'wax', 'jenny-metaverse-dao-token', 'superfarm', 'alien-worlds', 'auction', 'nftx'], description: JSON.stringify({ en: 'NFT projects.' }) },
  { id: 8, uid: 'privacy', name: 'Privacy', coins: ['zcash', 'dash', 'monero', 'ocean-protocol', 'tornado-cash', 'nucypher', 'secret', 'haven', 'keep-network', 'hopr', 'sentinel', 'dusk-network', 'zencash', 'verge', 'oasis-network', 'zcoin', 'grin', 'pirate-chain', 'orchid-protocol'], description: JSON.stringify({ en: 'Projects working on privacy solutions.' }) },
  { id: 9, uid: 'storage', name: 'Storage', coins: ['bluzelle', 'storj', 'filecoin', 'holotoken', 'arweave', 'siacoin', 'prometeus', 'crust-network', 'bittorrent-2'], description: JSON.stringify({ en: 'Decentralized data-storage.' }) },
  { id: 10, uid: 'wallets', name: 'Wallets', coins: ['status', 'swissborg', 'trust-wallet-token', 'nexo', 'crypto-com-chain', 'math', 'safepal', 'gnosis', 'oxygen', 'pundi-x-2'], description: JSON.stringify({ en: 'Tokens issued by cryptocurrency wallets.' }) },
  { id: 11, uid: 'identity', name: 'Identity', coins: ['selfkey', 'metadium', 'fio-protocol', 'civic', 'carry', 'litentry'], description: JSON.stringify({ en: 'Decentralized identity.' }) },
  { id: 12, uid: 'scaling', name: 'Scaling', coins: ['celer-network', 'omisego', 'xdai-stake', 'matic-network', 'hermez-network-token', 'harmony', 'elrond-erd-2', 'loopring', 'skale'], description: JSON.stringify({ en: 'Solutions for faster blockchain transactions.' }) },
  { id: 13, uid: 'analytics', name: 'Analytics', coins: ['parsiq', 'dextools', 'big-data-protocol', 'graphlinq-protocol', 'uniwhales', 'yieldwatch', 'step-finance', 'santiment-network-token'], description: JSON.stringify({ en: 'Token-powered analytics and investment instruments.' }) },
  { id: 14, uid: 'yield_tokens', name: 'Yield Tokens', coins: ['cdai', 'compound-usd-coin', 'compound-usdt', 'compound-wrapped-btc', 'ccomp', 'compound-uniswap', 'compound-ether', 'aave-dai-v1', 'aave-usdc-v1', 'aave-tusd-v1', 'aave-usdt-v1', 'aave-tusd-v1', 'aave-link-v1', 'aave-mkr-v1', 'aave-wbtc-v1', 'aave-busd-v1', 'aave-ren-v1', 'meowshi', 'xsushi'], description: JSON.stringify({ en: 'Interesting Bearing Tokens.' }) },
  { id: 15, uid: 'exchange_tokens', name: 'Exchange Tokens', coins: ['ftx-token', 'okb', 'kucoin-shares', 'huobi-token', 'crypto-com-chain', 'wazirx', 'mx-token', 'binancecoin', 'gatechain-token', 'leo-token', 'woo-network', 'zipmex-token', 'tokocrypto', 'zb-token', 'orion-protocol'], description: JSON.stringify({ en: 'Tokens issued by centralized exchanges.' }) },
  { id: 16, uid: 'stablecoins', name: 'Stablecoins', coins: ['tether', 'usd-coin', 'terrausd', 'dai', 'nusd', 'binance-usd', 'paxos-standard', 'gemini-dollar', 'true-usd', 'vai', 'liquity-usd', 'neutrino', 'fei-protocol', 'frax', 'husd', 'alchemix-usd', 'celo-dollar', 'tether-eurt', 'usdk', 'magic-internet-money'], description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to fiat currency.' }) },
  { id: 17, uid: 'tokenized_bitcoin', name: 'Tokenized Bitcoin', coins: ['wrapped-bitcoin', 'tbtc', 'huobi-btc', 'renbtc', 'ptokens-btc', 'sbtc', 'the-tokenized-bitcoin'], description: JSON.stringify({ en: 'Crypto tokens pegged 1-1 to Bitcoin price.' }) },
  { id: 18, uid: 'risk_management', name: 'Risk Management', coins: ['nxm', 'nsure-network', 'barnbridge', 'dhedge-dao', 'saffron-finance', 'melon', 'stafi', 'hedget', 'armor', 'insurace', 'wrapped-nxm', 'ribbon-finance'], description: JSON.stringify({ en: 'Risk assessment, insurance and hedging.' }) },
  { id: 19, uid: 'synthetics', name: 'Synthetics', coins: ['havven', 'uma', 'mirror-protocol', 'alchemix', 'stp-network', 'terra-luna'], description: JSON.stringify({ en: 'Platforms for creating decentralized synthetic assets.' }) },
  { id: 20, uid: 'index_funds', name: 'Index Funds', coins: ['defipulse-index', 'power-index-pool-token', 'defi-top-5-tokens-index', 'cryptocurrency-top-10-tokens-index', 'degen-index', 'piedao-defi-large-cap', 'eth-2x-flexible-leverage-index', 'btc-2x-flexible-leverage-index', 'basketdao-defi-index'], description: JSON.stringify({ en: 'Assets that pegged in price to a set of tokens.' }) },
  { id: 21, uid: 'prediction', name: 'Prediction', coins: ['augur', 'plotx', 'gnosis', 'polkamarkets', 'prosper'], description: JSON.stringify({ en: 'Markets to bet on events in the future.' }) },
  { id: 22, uid: 'fundraising', name: 'Fundraising', coins: ['polkastarter', 'duckdaodime', 'trustswap', 'dao-maker', 'cardstarter', 'occamfi', 'poolz-finance'], description: JSON.stringify({ en: 'Fundraising and token sale platforms.' }) },
  { id: 23, uid: 'infrastructure', name: 'Infrastructure', coins: ['republic-protocol', 'origin-protocol', 'the-graph', 'ankr', 'allianceblock', 'kusama', 'lisk', 'wanchain', 'contentos', 'bonfida', 'keep3rv1', 'nervos-network', 'dora-factory', 'mxc', 'blockstack', 'radicle', 'aelf', 'strong'], description: JSON.stringify({ en: 'Projects building infrastructure solutions.' }) }
]

module.exports = {
  up: async queryInterface => {
    const categoryCoins = []
    const categoryRecords = []

    categories.forEach(({ coins, ...category }) => {
      categoryCoins.push({ coins, categoryId: category.id })
      categoryRecords.push(category)
    })

    await queryInterface.bulkInsert('categories', categoryRecords, {})

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
