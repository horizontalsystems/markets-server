const RpcSource = require('./RpcSource')

const mainnet = new RpcSource('mainnet')
const sepolia = new RpcSource('sepolia')

// namespaces that are never forwarded — expensive or node-admin calls
const DENIED_METHODS = ['personal_', 'admin_', 'miner_', 'txpool_', 'engine_', 'debug_', 'trace_', 'les_', 'clique_']
const MAX_BATCH_SIZE = 50

const rejectCall = call => {
  if (!call || typeof call !== 'object' || typeof call.method !== 'string') {
    return 'Invalid request'
  }

  if (DENIED_METHODS.some(prefix => call.method.startsWith(prefix))) {
    return `Method not supported: ${call.method}`
  }

  return null
}

const rejectBody = body => {
  const calls = Array.isArray(body) ? body : [body]

  if (!calls.length || calls.length > MAX_BATCH_SIZE) {
    return 'Invalid request'
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const call of calls) {
    const reason = rejectCall(call)
    if (reason) return reason
  }

  return null
}

const makeProxy = source => async (req, res) => {
  const reason = rejectBody(req.body)

  if (reason) {
    return res.status(400).send({ error: reason })
  }

  try {
    return res.send(await source.post(req.body))
  } catch ({ response }) {
    if (response) {
      source.rotateSource()
      try {
        return res.send(await source.post(req.body))
      } catch (err) {
        const status = (err.response && err.response.status) || response.status || 500
        return res.status(status).send('Internal server error')
      }
    }

    return res.status(500).send('Internal server error')
  }
}

exports.makeProxy = makeProxy
exports.mainnetProxy = makeProxy(mainnet)
exports.sepoliaProxy = makeProxy(sepolia)
