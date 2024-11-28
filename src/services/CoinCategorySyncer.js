const Category = require('../db/models/Category')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const Coin = require('../db/models/Coin')
const CoinCategory = require('../db/models/CoinCategories')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')

class CoinCategorySyncer extends CoinPriceHistorySyncer {
  constructor() {
    super()

    this.categoriesMap = {
      'Centralized Exchange (CEX) Token': 'Centralized Exchange (CEX)',
      'Decentralized Exchange (DEX)': 'Decentralized Exchange (DEX)',
      Stablecoins: 'Stablecoins',
      Meme: 'Meme',
      NFT: 'NFT',
      'Liquid Staking Tokens': 'Liquid Staking Tokens',
      'Artificial Intelligence (AI)': 'Artificial Intelligence (AI)',
      Governance: 'Governance',
      'Zero Knowledge (ZK)': 'Zero Knowledge (ZK)',
      'Gaming (GameFi)': 'Gaming (GameFi)',
      Storage: 'Storage',
      Metaverse: 'Metaverse',
      'Yield Farming': 'Yield Farming',
      Oracle: 'Oracle',
      'Privacy Coins': 'Privacy Coins',
      'Lending/Borrowing': 'Lending/Borrowing',
      Sports: 'Sports',
      'Decentralized Identifier (DID)': 'Identity',
      Wallets: 'Wallets',
      Launchpad: 'Launchpad',
      'BRC-20': 'BRC-20',
      'Cross-chain Communication': 'Cross-chain',
      'Tokenized Gold': 'Tokenized Gold',
      Options: 'Options',
      'Yield Aggregator': 'Yield Aggregator',
      'Rebase Tokens': 'Rebase Tokens',
      'Fan Token': 'Fan Token',
      Music: 'Music',
      'RWA Protocol': 'RWA (Real World Assets)',
    }
  }

  async start() {
    await this.sync()
  }

  async sync(uids) {
    const coins = await this.getCoins(uids)
    const categoryMap = await this.mapCategories()
    console.log(`Coins to sync categories ${coins.uids.length}`)

    for (let i = 0; i < coins.uids.length; i += 1) {
      const coinUid = coins.uids[i]
      const coinId = coins.map[coinUid]
      console.log(`Syncing category for coin ${coinUid} (${i + 1})`)
      await this.syncCoinCategories(coinUid, coinId, categoryMap)
      await utils.sleep(20000)
    }
  }

  async syncCoinCategories(uid, coinId, categoryMap) {
    try {
      const categories = await coingecko.getCoinCategories(uid)

      for (let i = 0; i < categories.length; i += 1) {
        const name = categories[i]
        const categoryId = categoryMap[name]
        if (categoryId) {
          await CoinCategory.findOrCreate({
            where: { coin_id: coinId, category_id: categoryId },
            defaults: {
              coin_id: coinId,
              category_id: categoryId
            }
          })
        }
      }
    } catch (e) {
      await this.handleHttpError(e)
    }
  }

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      },
      raw: true
    })

    const uids = []
    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      map[coin.coingecko_id] = coin.id
      uids.push(coin.coingecko_id)
    }

    return { map, uids }
  }

  async mapCategories() {
    const categories = await coingecko.getCategories()
    const map = {}

    for (let i = 0; i < categories.length; i += 1) {
      const category = categories[i]

      if (this.categoriesMap[category.name]) {
        const [record] = await Category.findOrCreate({
          where: { uid: category.id },
          defaults: {
            uid: category.id,
            name: category.name,
            description: {
              en: category.content
            }
          }
        })

        map[category.name] = record.id
      }
    }

    return map
  }
}

module.exports = CoinCategorySyncer
