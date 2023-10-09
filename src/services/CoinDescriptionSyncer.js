const { TextServiceClient } = require('@google-ai/generativelanguage').v1beta2
const { GoogleAuth } = require('google-auth-library')
const OpenAI = require('openai')
const utils = require('../utils')
const Coin = require('../db/models/Coin')

const { chat } = new OpenAI({
  organization: process.env.CHAT_GPT_ORG,
  apiKey: process.env.CHAT_GPT_KEY
})

const palm = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(process.env.PALM_KEY),
})

class CoinDescriptionSyncer {

  async start(language) {
    await this.sync(null, language)
  }

  async sync(uids, language) {
    const coins = await this.getCoins(uids)
    console.log(`Syncing ${coins.ids.length} coins`)

    for (let i = 0; i < coins.ids.length; i += 1) {
      const uid = coins.ids[i]
      await this.syncDescription(uid, coins.map[uid], language)
      await utils.sleep(300)
    }
  }

  async syncDescription(uid, coin, language) {
    console.log(`Syncing descriptions for ${uid}`)

    const content = JSON.stringify({ [coin.code]: coin.overview })
    const coinDesc = await this.getDescriptionFromGPT(content, language)

    await this.updateDescription(coin, coinDesc, language)
  }

  async getDescriptionFromGPT(content, language) {
    console.log('Fetching data from GPT')

    const prompt = utils.getGptPrompt(language)

    const { choices = [] } = await chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content }
      ]
    })

    const { message = {} } = choices[0] || {}

    return message
  }

  async getDescriptionFromPalm(prompt) {
    console.log('Fetching data from PaLM')

    const text = `
      ${utils.getGptPrompt()}
      ${prompt}`

    const [result] = await palm.generateText({
      model: 'models/text-bison-001',
      prompt: { text }
    })

    if (!result || !result.candidates || !result.candidates.length) {
      return null
    }

    const candidate = result.candidates[0]

    return candidate.output
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

  async getCoins(uid) {
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
      const coin = {
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description,
        overview: desc.en || item.name
      }

      if (coin.overview.length > 2500) {
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
