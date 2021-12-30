const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/transactions
  validateTransactions: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('erc20', 'bep20', 'solana'),
      interval: Joi.string().valid('1d', '7d', '30d')
    })
  }, options),
}
