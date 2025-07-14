const serializer = require('./vaults.serializer')
const Vault = require('../../db/models/Vault')
const { handleError } = require('../middlewares')

exports.index = async (req, res) => {
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
    })

    res.send(serializer.serializeIndex(vaults))
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Internal Server Error')
  }
}

exports.show = async ({ params, query }, res) => {
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

    res.send(serializer.serializeShow(vault, query.range_interval))
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Internal Server Error')
  }
}
