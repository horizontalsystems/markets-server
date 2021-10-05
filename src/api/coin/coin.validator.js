/* eslint-disable no-param-reassign */
const validator = require('validator')

const invalidRequest = (res, message) => {
  res
    .status(422)
    .send({
      error: message
    })
}

exports.validateMarkets = ({ query }, res, next) => {
  const {
    uids,
    orderDirection = 'desc',
    orderField = 'price_change'
  } = query

  if (!uids || !uids.length) {
    return invalidRequest(res, '\'uids\' cannot be blank')
  }

  if (!validator.isIn(orderDirection, ['desc', 'asc'])) {
    return invalidRequest(res, `'${orderDirection}' is not a valid value for 'orderDirection'`)
  }

  if (!validator.isIn(orderField, ['price_change', 'market_cap', 'total_volume'])) {
    return invalidRequest(res, `'${orderField}' is not a valid value for 'orderField'`)
  }

  next()
}

exports.validateMarketsPrices = ({ query }, res, next) => {
  if (!query.uids || !query.uids.length) {
    return invalidRequest(res, '\'uids\' cannot be blank')
  }

  next()
}

exports.validateTopMarkets = ({ query }, res, next) => {
  const {
    top = 250,
    orderDirection = 'desc',
    orderField = 'price_change',
    limit = top
  } = query

  if (top < 1 || top > 1000) {
    return invalidRequest(res, 'Invalid `top` value')
  }

  if (limit < 1 || limit > 1000) {
    return invalidRequest(res, 'Invalid `limit` value')
  }

  if (!validator.isIn(orderDirection, ['desc', 'asc'])) {
    return invalidRequest(res, `'${orderDirection}' is not a valid value for 'orderDirection'`)
  }

  if (!validator.isIn(orderField, ['price_change', 'market_cap', 'total_volume'])) {
    return invalidRequest(res, `'${orderField}' is not a valid value for 'orderField'`)
  }

  next()
}
