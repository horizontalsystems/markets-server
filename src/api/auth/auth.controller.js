const jwt = require('jsonwebtoken')
const util = require('@metamask/eth-sig-util')
const Subscription = require('../../db/models/Subscription')

function handleError(res, code, message) {
  res.status(code)
  res.send({ message })
}

const eip712 = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Activation: [
      { name: 'action', type: 'string' }
    ]
  },
  domain: {
    name: 'Unstoppable Wallet',
    version: '1',
    verifyingContract: process.env.CRYPTO_SUBSCRIPTION_CONTRACT
  },
  primaryType: 'Activation',
  message: {
    action: 'Activate Subscription'
  }
}

exports.getEip712Data = async (req, res) => {
  res.send(eip712)
}

exports.authenticate = async ({ body }, res) => {
  const { signature, address } = body

  try {
    const currentDate = new Date()
    const subscription = await Subscription.findOne({ where: { address } })
    const expireIn = parseInt(subscription ? (subscription.expire_date - currentDate) / 1000 / 60 : 0, 10)

    if (expireIn <= 0) {
      return handleError(res, 400, 'Expired or not subscribed yet')
    }

    const sigAddress = util.recoverTypedSignature({
      data: eip712,
      signature,
      version: 'V4'
    })

    if (address !== sigAddress) {
      return handleError(res, 400, 'Invalid signature')
    }

    const token = jwt.sign({ address, loginDate: currentDate.getTime() }, process.env.SECRET, {
      expiresIn: `${expireIn}m`
    })

    await subscription.update({ login_date: currentDate })

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

    next()
  })
}
