const utils = require('../utils')
const gpt = require('../providers/chat-gpt')
const grok = require('../providers/grok-ai')
const gemini = require('../providers/gemini-ai')
const Coin = require('../db/models/Coin')

class CoinDescriptionSyncer {
  constructor(reference, force) {
    this.ref = reference
    this.force = force
  }

  async start(language) {
    await this.sync(null, language)
  }

  async sync(uids, language) {
    const coins = await this.getCoins(uids, language)
    console.log(`Syncing ${coins.ids.length} coins`)

    for (let i = 0; i < coins.ids.length; i += 1) {
      const uid = coins.ids[i]
      await this.syncDescription(uid, coins.map[uid], language)
      await utils.sleep(300)
    }
  }

  async syncDescription(uid, coin, language) {
    console.log(`Syncing descriptions for ${uid}`, language ? language.name : null)

    const content = JSON.stringify({
      [coin.code]: coin.descriptionReference
    })

    let coinDesc = await gpt.getCoinDescription(content, language)
    if (!coinDesc) {
      coinDesc = await gemini.getCoinDescription(content, language)
    }
    if (!coinDesc) {
      coinDesc = await grok.getCoinDescription(content, language)
    }

    if (this.force) {
      console.log(coinDesc)
    }

    await this.updateDescription(coin, coinDesc, language)
  }

  async updateDescription(coin, content, language) {
    if (!content || content === 'null') {
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

  async getCoins(uid, language) {
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
      if (language && desc[language.code] && !this.force) {
        continue
      }

      const coin = {
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description,
        descriptionReference: desc.en || item.name
      }

      if (coin.descriptionReference.length > 3500) {
        coin.descriptionReference = item.name
      }

      if (this.ref) {
        coin.descriptionReference = this.ref
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
