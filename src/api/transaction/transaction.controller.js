const Transaction = require('../../db/models/Transaction')

exports.index = async (req, res) => {
  const transactions = await Transaction.findAll()
  res.status(200).json(transactions)
}
