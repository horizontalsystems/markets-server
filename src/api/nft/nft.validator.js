const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/nft/collections
  validateCollections: validate({
    query: Joi.object({
      asset_owner: Joi.string(),
      simplified: Joi.boolean(),
      limit: Joi.number()
        .min(1)
        .max(1500),
      page: Joi.number()
        .min(1),
      // @deprecated
      offset: Joi.number()
        .min(0),
    })
  }, options),

  // GET /v1/nft/collection/:collection_uid
  validateCollection: validate({
    query: Joi.object({
      include_stats_chart: Joi.boolean()
    })
  }, options),

  // GET /v1/nft/assets
  validateAssets: validate({
    query: Joi.object({
      owner: Joi.string(),
      token_ids: Joi.string(),
      contract_addresses: Joi.string(),
      collection_uid: Joi.string(),
      include_orders: Joi.boolean(),
      order_direction: Joi.string().valid('asc', 'desc'),
      cursor: Joi.string(),
      limit: Joi.number()
        .min(1)
        .max(1500),
      // @deprecated
      offset: Joi.number()
        .min(0),
    })
  }, options),

  // GET /v1/nft/asset/:uid
  validateAsset: validate({
    query: Joi.object({
      account_address: Joi.string(),
      include_orders: Joi.boolean()
    })
  }, options),

  // GET /v1/nft/events
  validateEvents: validate({
    query: Joi.object({
      event_type: Joi.string(),
      account_address: Joi.string(),
      token_id: Joi.string(),
      asset_contract: Joi.string(),
      collection_uid: Joi.string(),
      occured_before: Joi.number(),
      cursor: Joi.string()
    })
  }, options),
}
