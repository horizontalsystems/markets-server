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
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y')
    })
  }, options),

  // GET /v1/transactions/dex-volumes
  validateDexVolumes: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('erc20', 'bep20', 'solana'),
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y')
    })
  }, options),

  // GET /v1/transactions/dex-liquidity
  validateDexLiquidity: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('erc20', 'bep20'),
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y')
    })
  }, options),
}
