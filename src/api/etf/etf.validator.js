const { validate, Joi } = require('../validations')

module.exports = {
  // GET /v1/etf/all
  validateEtfAll: validate({
    query: Joi.object({
      category: Joi.string().required().valid('btc', 'eth'),
      currency: Joi.string(),
    })
  }),

  // GET /v1/etf/chart
  validateEtfChart: validate({
    query: Joi.object({
      category: Joi.string().required().valid('btc', 'eth'),
      interval: Joi.string().required().valid('1m', '3m', '6m', '1y', 'all'),
      currency: Joi.string(),
    })
  }),

  // GET /v1/etf/treasuries
  validateEtfTreasuries: validate({
    query: Joi.object({
      type: Joi.string().valid(
        'public-companies',
        'private-companies',
        'etfs-and-exchanges',
        'governments',
        'defi-and-other'
      ),
    })
  }),
}
