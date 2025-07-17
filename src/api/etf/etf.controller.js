const serializer = require('./etf.serializer')
const Etf = require('../../db/models/Etf')
const EtfTotalInflow = require('../../db/models/EtfTotalInflow')
const TreasuryCompany = require('../../db/models/TreasuryCompany')

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

exports.chart = async ({ query, currencyRate }, res) => {
  const where = {}

  if (query.category) {
    where.category = query.category
  }

  const data = await EtfTotalInflow.findAll({
    raw: true,
    where
  })

  res.send(serializer.serializeTotal(data, currencyRate))
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
