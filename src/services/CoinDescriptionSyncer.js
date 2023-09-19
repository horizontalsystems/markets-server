const OpenAI = require('openai')
const utils = require('../utils')
const Coin = require('../db/models/Coin')

const { chat } = new OpenAI({
  organization: process.env.CHAT_GPT_ORG,
  apiKey: process.env.CHAT_GPT_KEY
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
      await utils.sleep(300)
    }
  }

  async syncDescription(uid, coin) {
    console.log(`Syncing descriptions for ${uid}`)

    const { choices = [] } = await chat.completions.create({
      messages: [{
        role: 'system',
        content: `
You're an educator and expert with in-depth knowledge of cryptocurrency and blockchain fields. One of your core strengths lies in your ability to break down complex subjects into simple concepts that people without specialized knowledge can understand. 
You will receive a list of cryptocurrencies in a key-value format, where the key represents the ID and the value represents its description. Your task is to obtain a good and lengthy overview of each project that captures its key points. The summary should explain not only the project but also the purpose behind it i.e. what problem the project aims to solve, the actors involved, etc. Try to break it down into many paragraphs so it's easier to follow and use the descriptions as a reference.
These overviews are primarily aimed at people looking to invest in the respective projects. In a way, the description will be used for not only educational purposes but also as a means to evaluate the project's validity. Avoid using technical terms not known to people not involved with blockchain technologies.
Always format the response in the Markdown. Return null if delivering an overview is not possible.`
      }, {
        role: 'user',
        content: JSON.stringify({ [uid]: coin.overview })
      }],
      model: 'gpt-4-0613',
    })

    const { message = {} } = choices[0] || {}
    await this.updateDescription(coin, message)
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
      attributes: ['id', 'uid', 'name', 'description'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const item = {
        id: coin.id,
        name: coin.name,
        description: coin.description,
        overview: (coin.description || {}).en
      }

      if (!item.overview) {
        item.overview = item.name
      }

      map[coin.uid] = item
    }

    return {
      map,
      ids: Object.keys(map)
    }
  }
}

module.exports = CoinDescriptionSyncer
