const RpcSource = require('./RpcSource')

const mainnet = new RpcSource(true)
const sepolia = new RpcSource(false)

exports.mainnetProxy = async (req, res) => {
  try {
    res.send(await mainnet.post(req.body))
  } catch ({ response, message }) {
    if (response) {
      mainnet.rotateSource()
      try {
        res.send(await mainnet.post(req.body))
      } catch (err) {
        res.status(response.status || 500).send('Internal server error')
      }
    } else {
      res.status(500).send(message || 'Internal server error')
    }
  }
}

exports.sepoliaProxy = async (req, res) => {
  try {
    res.send(await sepolia.post(req.body))
  } catch ({ response, message }) {
    if (response) {
      sepolia.rotateSource()
      try {
        res.send(await sepolia.post(req.body))
      } catch (err) {
        res.status(response.status || 500).send('Internal server error')
      }
    } else {
      res.status(500).send(message || 'Internal server error')
    }
  }
}
