const jwt = require('jsonwebtoken')
const util = require('ethereumjs-util')
const { v4: uuidv4 } = require('uuid')
const AuthKey = require('../../db/models/AuthKey')
const Subscription = require('../../db/models/Subscription')
const CryptoSubscription = require('../../providers/crypto-subscription')
const apiKeys = require('./api-keys.json')
const { utcDate, signingMessage } = require('../../utils')
const { handleError } = require('../middlewares')

exports.generateMessage = async ({ query: { address } }, res) => {
  try {
    const subscription = await Subscription.getActive([address])
    if (!subscription.length) {
      return handleError(res, 403, 'Not subscribed yet')
    }

    const randomKey = uuidv4()
    const expiresAt = utcDate({ minutes: 5 })
    await AuthKey.upsert({
      address,
      key: randomKey,
      expires_at: expiresAt
    })

    res.send({ message: signingMessage(address, randomKey) })
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Something went wrong')
  }
}

exports.authenticate = async ({ body }, res) => {
  const { signature, address } = body

  const authKey = await AuthKey.getValidKey(address)
  if (!authKey) {
    return handleError(res, 400, 'Invalid address or expired key')
  }

  try {
    const currentDate = new Date()
    const subscription = await Subscription.findOne({ where: { address } })
    const expireIn = parseInt(subscription ? (subscription.expire_date - currentDate) / 1000 / 60 : 0, 10)

    if (expireIn <= 0) {
      return handleError(res, 400, 'Expired or not subscribed yet')
    }

    const hash = util.hashPersonalMessage(Buffer.from(signingMessage(address, authKey.key)))
    const sig = util.fromRpcSig(signature)
    const sigPubKey = util.ecrecover(hash, sig.v, sig.r, sig.s)
    const sigAddress = util.bufferToHex(util.publicToAddress(sigPubKey))

    if (address !== sigAddress) {
      return handleError(res, 400, 'Invalid signature')
    }

    const token = jwt.sign({ address, loginDate: currentDate.getTime() }, process.env.SECRET, {
      expiresIn: `${expireIn}m`
    })

    await subscription.update({ login_date: currentDate })
    await authKey.destroy()

    res.send({ token })
  } catch (err) {
    console.log(err)
    return handleError(res, 400, 'Invalid signature')
  }
}

exports.requireAuth = (req, res, next) => {
  const { authorization: token } = req.headers

  if (!token) {
    return handleError(res, 401, 'Unauthorized')
  }

  jwt.verify(token, process.env.SECRET, async (err, payload) => {
    if (err) {
      console.log(err)
      return handleError(res, 403)
    }

    if (!payload || !payload.address || !payload.loginDate) {
      return handleError(res, 403)
    }

    const subscription = await Subscription.findOne({ where: { address: payload.address } })
    if (!subscription) {
      return handleError(res, 403)
    }

    if (subscription.login_date && subscription.login_date.getTime() > payload.loginDate) {
      return handleError(res, 401, 'Logged in on another device')
    }

    // eslint-disable-next-line no-param-reassign
    req.address = payload.address

    next()
  })
}

exports.subscribed = async ({ query }, res) => {
  if (!query.address || !query.chain) {
    return res.status(400)
  }

  try {
    const address = query.address.toLowerCase()
    const subscription = new CryptoSubscription(query.chain)
    const deadline = parseInt(await subscription.getSubscriptionDeadline(address), 10)
    console.log(`Subscribed ${address} with deadline ${deadline}`)

    const record = {
      address,
      chain: query.chain
    }

    if (deadline) {
      record.expire_date = new Date(deadline * 1000)
    }

    await Subscription.upsert(record)

    res.send({})
  } catch (e) {
    console.log(e)
    res.status(500)
    res.send({ error: 'Internal server error' })
  }
}

exports.apiKeys = async (req, res) => {
  try {
    res.json(apiKeys)
  } catch (e) {
    handleError(res, 403)
  }
}
