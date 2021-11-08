const Report = require('../../db/models/Report')
const serializer = require('./reports.serializer')

exports.index = async ({ query }, res) => {
  const reports = await Report.getList(query.coin_uid)
  res.send(serializer.serializeReports(reports))
}
