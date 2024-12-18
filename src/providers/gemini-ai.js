const { GoogleGenerativeAI } = require('@google/generative-ai')
const utils = require('../utils')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)

exports.getCoinDescription = async (prompt) => {
  console.log('Fetching data from Gemini')

  try {
    const text = `
      ${utils.getGptPrompt()}
      ${prompt}`

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    })

    const { response } = await model.generateContent(text)
    return response.text()
  } catch (error) {
    return null
  }
}
