const { validate, Joi } = require('../validations')

module.exports = {
  // GET /v1/analytics/ranks
  validateRanks: validate({
    query: Joi.object({
      currency: Joi.string(),
      type: Joi.string().required()
        .valid(
          'cex_volume',
          'dex_volume',
          'dex_liquidity',
          'tx_count',
          'revenue',
          'address',
          'holders',
        )
    })
  }),

  // GET /v1/analytics/:uid
  validateShow: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      currency: Joi.string(),
    })
  }),

  // GET /v1/analytics/:uid/preview
  validatePreview: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      address: Joi.string()
    })
  }),

  // GET /v1/analytics/:uid/holders
  validateHolders: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      blockchain_uid: Joi.string().required()
    })
  }),

  // GET /v1/analytics/:uid/[transactions/address/dex-volumes/dex-liquidity]
  validateDexData: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      currency: Joi.string(),
      interval: Joi.string().valid('1w', '2w', '1m', '3m', '6m', '1y', 'all')
    })
  }),

}
