const { valueInCurrency } = require('../../utils')

exports.serializeTreasuries = (treasuries, currencyRate) => {
  return treasuries.map(item => ({
    type: item.type,
    fund: item.fund,
    amount: item.amount,
    amountInCurrency: valueInCurrency(item.amount_usd, currencyRate),
    country: item.country
  }))
}

exports.serializeFundsInvested = (treasuries, currencyRate) => {
  return treasuries.map(item => ({
    date: item.date,
    round: item.round,
    amount: valueInCurrency(item.amount, currencyRate),
    funds: item.funds
  }))
}
