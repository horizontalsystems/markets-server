const { TextServiceClient } = require('@google-ai/generativelanguage').v1beta2
const { GoogleAuth } = require('google-auth-library')
const utils = require('../utils')

const palm = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(process.env.PALM_KEY),
})

exports.getCoinDescription = async (prompt) => {
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
