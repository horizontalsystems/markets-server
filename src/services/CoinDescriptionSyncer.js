const utils = require('../utils')
const gpt = require('../providers/chat-gpt')
const Coin = require('../db/models/Coin')

class CoinDescriptionSyncer {

  async start(language, force) {
    await this.sync(null, language, force)
  }

  async sync(uids, language, force) {
    const coins = await this.getCoins(uids, language, force)
    console.log(`Syncing ${coins.ids.length} coins`)

    for (let i = 0; i < coins.ids.length; i += 1) {
      const uid = coins.ids[i]
      await this.syncDescription(uid, coins.map[uid], language)
      await utils.sleep(300)
    }
  }

  async syncDescription(uid, coin, language) {
    console.log(`Syncing descriptions for ${uid}`, language ? language.name : null)

    const content = JSON.stringify({ [coin.code]: coin.overview })
    const coinDesc = await gpt.getCoinDescription(content, language)

    await this.updateDescription(coin, coinDesc, language)
  }

  async updateDescription(coin, { content }, language) {
    if (!content) {
      return
    }

    const description = { ...coin.description }

    if (language) {
      description[language.code] = content
    } else {
      description.en = content
    }

    await Coin.update({ description }, { where: { id: coin.id } })
      .then(() => console.log(`Updated information for the coin ${coin.name}`))
      .catch(e => console.error(e))
  }

  async getCoins(uid, language, force) {
    const coins = await Coin.findAll({
      attributes: ['id', 'uid', 'name', 'code', 'description', 'market_data'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const item = coins[i]

      const desc = item.description || {}

      // Skip if synced already
      if (language && desc[language.code] && !force) {
        continue
      }

      const coin = {
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description,
        overview: desc.en || item.name
      }

      if (coin.overview.length > 3500) {
        coin.overview = item.name
      }

      map[item.uid] = coin
    }

    return {
      map,
      ids: Object.keys(map)
    }
  }
}

module.exports = CoinDescriptionSyncer
