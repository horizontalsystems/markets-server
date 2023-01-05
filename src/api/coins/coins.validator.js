const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/coins
  validateCoins: validate({
    query: Joi.object({
      uids: Joi.string(),
      fields: Joi.string(),
      limit: Joi.number()
        .min(1)
        .max(1500),
      page: Joi.number()
        .min(1),
      defi: Joi.boolean()
        .sensitive(true),
      order_by_rank: Joi.boolean()
        .sensitive(true),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/coins/:uid
  validateShow: validate({
    query: Joi.object({
      language: Joi.string().valid('en', 'de', 'es', 'fa', 'fr', 'ko', 'ru', 'tr', 'zh', 'pt', 'inr'),
      currency: Joi.string()
    })
  }, options),

  validateChart: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      from_timestamp: Joi.number().required(),
      interval: Joi.string().valid('30m', '1h', '4h', '8h', '1d'),
      currency: Joi.string()
    })
  }, options),

  validatePriceHistory: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      timestamp: Joi.number().required(),
      currency: Joi.string()
    })
  }, options),
}
