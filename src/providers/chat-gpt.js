const OpenAI = require('openai')
const utils = require('../utils')

const { chat } = new OpenAI({
  organization: process.env.CHAT_GPT_ORG,
  apiKey: process.env.CHAT_GPT_KEY
})

exports.getCoinDescription = async (content, language) => {
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
