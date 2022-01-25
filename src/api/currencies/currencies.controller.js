const Currency = require('../../db/models/Currency')
const CurrencyRate = require('../../db/models/CurrencyRate')

exports.index = async (req, res) => {
  const currencies = await Currency.findAll()
  res.send(currencies)
}

exports.currencyRate = async ({ params }, res) => {
  const currencyRate = await CurrencyRate.getCurrencyRate(params.currencyCode)
  res.send({
    rate: currencyRate.rate,
    last_updated: Math.round(new Date(currencyRate.last_updated).getTime() / 1000)
  })
}
