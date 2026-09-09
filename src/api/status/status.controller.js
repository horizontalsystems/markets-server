const UpdateState = require('../../db/models/UpdateState')
const AppState = require('../../db/models/AppState')
const { serialize } = require('./status.serializer')

exports.index = async (req, res) => {
  res.send({
    code: 200,
    status: 'ok'
  })
}

exports.updates = async (req, res, next) => {
  try {
    const states = await UpdateState.getAll()
    res.send(serialize(states))
  } catch (e) {
    console.log(e)
    next()
  }
}

exports.appState = async ({ query }, res, next) => {
  try {
    const swapEnabled = await AppState.isSwapEnabled(query.version)

    res.send({ swap_enabled: swapEnabled })
  } catch (e) {
    console.log(e)
    next()
  }
}
