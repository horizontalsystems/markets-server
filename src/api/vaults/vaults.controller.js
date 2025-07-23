const serializer = require('./vaults.serializer')
const Vault = require('../../db/models/Vault')
const { handleError } = require('../middlewares')

exports.index = async ({ currencyRate }, res) => {
  try {
    const vaults = await Vault.findAll({
      raw: true,
      attributes: [
        'address',
        'name',
        'apy',
        'tvl',
        'chain',
        'asset_symbol',
        'asset_logo',
        'protocol_name',
        'protocol_logo',
        'holders',
        'url',
      ],
      order: [['tvl', 'DESC']]
    })

    res.send(serializer.serializeIndex(vaults, currencyRate))
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Internal Server Error')
  }
}

exports.show = async ({ params, query, currencyRate }, res) => {
  try {
    const vault = await Vault.findOne({
      raw: true,
      where: {
        address: params.address,
      }
    })

    if (!vault) {
      return handleError(res, 404, 'Vault not found')
    }

    res.send(serializer.serializeShow(vault, currencyRate, query.range_interval))
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Internal Server Error')
  }
}
