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
      chain: Joi.string().required().valid('ethereum', 'bsc', 'matic')
    })
  }, options),

  // GET /v1/addresses
  validateAddresses: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('bitcoin', 'erc20', 'bep20', 'solana', 'ethereum'),
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y'),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/addresses/holders
  validateHolders: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('bitcoin', 'erc20', 'bep20', 'solana', 'ethereum', 'binance-smart-chain'),
      limit: Joi.number().min(1).max(20),
    })
  }, options),

}
