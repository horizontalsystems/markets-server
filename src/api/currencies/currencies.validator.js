/* eslint-disable no-param-reassign */
const Currency = require('../../db/models/Currency')
const CurrencyPrice = require('../../db/models/CurrencyPrice')

exports.validate = async ({ query: { currency } }, res, next) => {

  if (currency && currency !== Currency.baseCurrency) {
    const currencyPrice = await CurrencyPrice.getLatestCurrencyPrice(currency)
    if (!currencyPrice) {
      return res.status(422).send({
        error: `Invalid currency :${(currency)}`
      })
    }

    res.locals.currencyPrice = currencyPrice
  } else {
    res.locals.currencyPrice = 1
  }

  next()
}
