const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/blockchains/:blockchain/hashes
  validateBlockNumber: validate({
    params: Joi.object({
      blockchain: Joi.string().valid('bitcoin', 'bitcoin-cash', 'dash', 'zcash', 'litecoin', 'ethereum', 'binance-smart-chain', 'polygon-pos', 'avalanche')
    })
  }, options),

  // GET /v1/blockchains/:blockchain/hashes
  validateHashes: validate({
    params: Joi.object({
      blockchain: Joi.string().valid('bitcoin', 'bitcoin-cash')
    })
  }, options)

}
