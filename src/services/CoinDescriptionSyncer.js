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

  async start() {
    await this.sync()
  }

  async sync(uids) {
    const coins = await this.getCoins(uids)

    for (let i = 0; i < coins.ids.length; i += 1) {
      const uid = coins.ids[i]
      await this.syncDescription(uid, coins.map[uid])
      await utils.sleep(500)
    }
  }

  async syncDescription(uid, coin) {
    console.log(`Syncing descriptions for ${uid}`)

    const content = JSON.stringify({ [coin.code]: coin.descEn || coin.name })
    const coinDesc = await this.getDescriptionFromGPT(content)

    await this.updateDescription(coin, coinDesc)
  }

  async getDescriptionFromGPT(content) {
    console.log('Fetching data from GPT')

    const { choices = [] } = await chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      messages: [
        { role: 'system', content: utils.getGptPrompt() },
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

  async updateDescription(coin, { content }) {
    if (!content) {
      return
    }

    const description = {
      ...coin.description,
      en: content
    }

    await Coin.update({ description }, { where: { id: coin.id } })
      .then(() => console.log(`Updated information for the coin ${coin.name}`))
      .catch(e => console.error(e))
  }

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'uid', 'name', 'code', 'description'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]

      map[coin.uid] = {
        id: coin.id,
        name: coin.name,
        code: coin.code,
        description: coin.description,
        descEn: (coin.description || {}).en
      }
    }

    return {
      map,
      ids: Object.keys(map)
    }
  }
}

module.exports = CoinDescriptionSyncer
