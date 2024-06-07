const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/coins
  validateCoins: validate({
    query: Joi.object({
      uids: Joi.string(),
      enabled_uids: Joi.string(),
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

  // GET /v1/coins/filter
  validateFilter: validate({
    query: Joi.object({
      limit: Joi.number()
        .min(1)
        .max(1500),
      page: Joi.number()
        .min(1),
      indicator: Joi.string()
        .valid('neutral', 'buy', 'sell', 'buy_signal', 'sell_signal', 'overbought', 'oversold'),
      order_by_rank: Joi.boolean()
        .sensitive(true),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/coins/indicators
  validateIndicators: validate({
    query: Joi.object({
      uids: Joi.string().required()
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
      from_timestamp: Joi.number(),
      interval: Joi.string().valid('30m', '1h', '4h', '8h', '1d', '1w', '1M'),
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

  validateGainers: validate({
    params: Joi.object({
      field: Joi.string().valid('price', 'price_change_1d', 'price_change_24h', 'price_change_1w', 'price_change_1m', 'price_change_3m', 'volume', 'mcap').required(),
    }),
    query: Joi.object({
      uids: Joi.string(),
      limit: Joi.number()
        .min(3)
        .max(10),
      order: Joi.string().valid('asc', 'desc'),
      currency: Joi.string()
    })
  }, options),
}
