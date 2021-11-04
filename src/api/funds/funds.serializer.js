const { valueInCurrency } = require('../../utils')

exports.serializeTreasuries = (treasuries, currencyRate) => {
  return treasuries.map(item => ({
    type: item.type,
    fund: item.fund,
    amount: item.amount,
    amount_in_currency: valueInCurrency(item.amount_usd, currencyRate),
    country: item.country
  }))
}

exports.serializeFundsInvested = (treasuries, currencyRate) => {
  return treasuries.map(item => ({
    date: item.date,
    round: item.round,
    amount: item.amount,
    amount_in_currency: valueInCurrency(item.amount_usd, currencyRate),
    funds: item.funds
  }))
}