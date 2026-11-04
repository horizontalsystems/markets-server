const RpcSource = require('./RpcSource')

const mainnet = new RpcSource('mainnet')
const sepolia = new RpcSource('sepolia')

const makeProxy = source => async (req, res) => {
  try {
    res.send(await source.post(req.body))
  } catch ({ response, message }) {
    if (response) {
      source.rotateSource()
      try {
        res.send(await source.post(req.body))
      } catch (err) {
        res.status(response.status || 500).send('Internal server error')
      }
    } else {
      res.status(500).send(message || 'Internal server error')
    }
  }
}

exports.makeProxy = makeProxy
exports.mainnetProxy = makeProxy(mainnet)
exports.sepoliaProxy = makeProxy(sepolia)
