const Coin = require('./coin.model')
const CoinGeckoProvider = require('../../providers/CoinGeckoProvider')
const Language = require('../language/language.model');

exports.index = async (req, res) => {
  const coins = await Coin.search(req.query.filter)
  res.status(200).json(coins)
}

exports.show = async (req, res, next) => {
  const provider = new CoinGeckoProvider()

  const coin = await Coin.getById(req.params.id)
  const coinInfo = await provider.getCoinInfo(req.params.id)

  if (coin && coinInfo) {
    const languages = await Language.findAll()

    const platforms = coin.PlatformReferences.map(reference => (
      { id: reference.PlatformId, value: reference.value, }
    ))

    const categoryIds = coin.Categories.map(category => (category.id))

    const hasDefinedDescriptions = coin.CoinDescriptions.length !== 0

    const descriptions = languages.reduce((result, language) => {
      let content

      if (hasDefinedDescriptions) {
        const description = coin.CoinDescriptions.find(desc => {
          return desc.LanguageId === language.id
        })

        if (description) {
          content = description.content
        }
      } else {
        content = coinInfo.description[language.id]
      }

      if (content) {
        result.push({
          language_id: language.id,
          content
        })
      }

      return result
    }, [])

    const result = {
      id: coin.id,
      name: coin.name,
      code: coin.code,
      platforms,
      category_ids: categoryIds,
      descriptions,
      // coinInfo
    }

    res.status(200).json(result)
  } else {
    next()
  }
}

exports.create = (req, res) => {
  res.send('OK')
}

exports.upsert = (req, res) => {
  res.send('OK')
}

exports.patch = (req, res) => {
  res.send('OK')
}

exports.destroy = (req, res) => {
  res.send('OK')
}
