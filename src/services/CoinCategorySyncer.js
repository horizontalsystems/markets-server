const Syncer = require('./Syncer')
const Category = require('../db/models/Category')
const Coin = require('../db/models/Coin')
const CoinCategory = require('../db/models/CoinCategories')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')

class CoinCategorySyncer extends Syncer {
  constructor() {
    super()

    this.whitelisted = [
      'Layer 1 (L1)',
      'Centralized Exchange (CEX)',
      'Decentralized Exchange (DEX)',
      'Stablecoins',
      'Meme',
      'NFT',
      'Liquid Staking Tokens',
      'Artificial Intelligence (AI)',
      'Governance',
      'Zero Knowledge (ZK)',
      'Gaming (GameFi)',
      'Storage',
      'Metaverse',
      'Yield Farming',
      'Oracle',
      'Privacy',
      'Lending/Borrowing',
      'Sports',
      'Identity',
      'Wallets',
      'Launchpad',
      'BRC-20',
      'Cross-chain Communication',
      'Tokenized Gold',
      'Options',
      'Yield Aggregator',
      'Rebase Tokens',
      'Fan Token',
      'Music'
    ].reduce((res, key) => ({ ...res, [key]: 1 }), {})
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

      if (this.whitelisted[category.name]) {
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
