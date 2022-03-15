const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/nft/collections
  validateCollections: validate({
    query: Joi.object({
      asset_owner: Joi.string(),
      limit: Joi.number()
        .min(1)
        .max(1500),
      page: Joi.number()
        .min(1),
      offset: Joi.number()
        .min(0),
    })
  }, options),

  // GET /v1/nft/assets/:uid
  validateAssets: validate({
    query: Joi.object({
      owner: Joi.string(),
      token_ids: Joi.string(),
      contract_addresses: Joi.string(),
      collection: Joi.string(),
      limit: Joi.number()
        .min(1)
        .max(1500),
      page: Joi.number()
        .min(1),
      offset: Joi.number()
        .min(0),
    })
  }, options),

}
