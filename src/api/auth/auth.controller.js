const jwt = require('jsonwebtoken')
const util = require('ethereumjs-util')
const crypto = require('crypto')
const opensea = require('../../providers/opensea')
const AuthKey = require('../../db/models/AuthKey')
const { utcDate } = require('../../utils')

function handleError(res, code, message) {
  res.status(code)
  res.send({ message })
}

exports.generateKey = async ({ query }, res) => {
  try {
    const randomKey = crypto.randomBytes(10).toString('base64')
    const expiresAt = utcDate({ minutes: 1 })
    await AuthKey.upsert({
      address: query.address,
      key: randomKey,
      expires_at: expiresAt
    })

    res.send({ key: randomKey })
  } catch (e) {
    console.log(e)
    res.send({ message: 'Something went wrong' })
  }
}

exports.authenticate = async ({ body }, res) => {
  const { signature, address } = body

  const authKey = await AuthKey.getValidKey(address)
  if (!authKey) {
    return handleError(res, 400, 'Invalid address or expired key')
  }

  try {
    const hash = util.hashPersonalMessage(Buffer.from(authKey.key))
    const sig = util.fromRpcSig(signature)
    const sigPubKey = util.ecrecover(hash, sig.v, sig.r, sig.s)
    const sigAddress = util.bufferToHex(util.publicToAddress(sigPubKey))

    if (address !== sigAddress) {
      return handleError(res, 400, 'Invalid signature')
    }

    const nft = await opensea.getAssets(address, 'sushinft')
    if (!nft || !nft.assets || !nft.assets.length) {
      return handleError(res, 400, 'Not an NFT owner')
    }

    const token = jwt.sign({ address }, process.env.SECRET, { expiresIn: '7d' })
    await authKey.destroy()

    res.send({ token })
  } catch (err) {
    console.log(err)
    return handleError(res, 400, 'Invalid signature')
  }
}

exports.requireAuth = (req, res, next) => {
  const { authorization } = req.headers

  const token = authorization && authorization.split(' ')[1]
  if (!token) {
    return handleError(res, 401, 'Unauthorized')
  }

  jwt.verify(token, process.env.SECRET, (err, payload) => {
    if (err) {
      console.log(err)
      return handleError(res, 403)
    }

    if (!payload || !payload.address) {
      return handleError(res, 403)
    }

    next()
  })
}
