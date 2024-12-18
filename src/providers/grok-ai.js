const axios = require('axios')
const utils = require('../utils')

const api = axios.create({
  baseURL: 'https://api.x.ai/v1/chat/completions',
  headers: {
    Authorization: `Bearer ${process.env.X_AI_KEY}`
  }
})

exports.getCoinDescription = async (content, language) => {
  console.log('Fetching data from Grok')

  try {
    const prompt = utils.getGptPrompt(language)

    const { choices } = await api.post('', {
      model: 'grok-2-1212',
      stream: false,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content }
      ]
    }).then(res => res.data)

    const { message = {} } = choices[0] || {}

    return message.content
  } catch (error) {
    console.error(error)
    return null
  }
}
