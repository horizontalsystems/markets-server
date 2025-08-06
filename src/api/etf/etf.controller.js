const serializer = require('./etf.serializer')
const Etf = require('../../db/models/Etf')
const EtfTotalInflow = require('../../db/models/EtfTotalInflow')
const TreasuryCompany = require('../../db/models/TreasuryCompany')
const { handleError } = require('../middlewares')

exports.index = async (req, res) => {
  const etfs = await Etf.findAll({
    raw: true,
    where: {
      category: 'btc'
    }
  })

  res.send(serializer.serializeIndex(etfs))
}

exports.all = async ({ query, currencyRate }, res) => {
  const where = {}

  if (query.category) {
    where.category = query.category
  }

  const etfs = await Etf.findAll({
    raw: true,
    where
  })

  res.send(serializer.serializeIndex(etfs, currencyRate))
}

exports.chart = async ({ query, currencyRate, dateFrom }, res) => {
  try {
    const data = await EtfTotalInflow.getListBy(query.category, dateFrom)
    res.send(serializer.serializeChart(data, currencyRate))
  } catch (e) {
    handleError(res, 500, 'Internal Server Error')
  }
}

exports.treasuries = async ({ query }, res) => {
  const where = {}

  if (query.type) {
    where.type = query.type
  }

  const data = await TreasuryCompany.findAll({
    raw: true,
    where
  })

  res.send(serializer.serializeTreasuries(data))
}

exports.total = async (req, res) => {
  const data = await EtfTotalInflow.findAll({
    raw: true,
    where: {
      category: 'btc'
    }
  })

  res.send(serializer.serializeTotal(data))
}
