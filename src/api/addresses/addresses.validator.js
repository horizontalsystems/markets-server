const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/addresses/:accountAddress/coins
  validateAddressCoins: validate({
    params: Joi.object({
      address: Joi.string().required()
    }),
    query: Joi.object({
      chain: Joi.string().required().valid('ethereum', 'binance-smart-chain', 'polygon-pos')
    })
  }, options),

  // GET /v1/addresses
  validateAddresses: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('bitcoin', 'ethereum', 'binance-smart-chain', 'solana'),
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y'),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/addresses/holders
  validateHolders: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('bitcoin', 'solana', 'ethereum', 'binance-smart-chain'),
      limit: Joi.number().min(1).max(20),
    })
  }, options),

}
