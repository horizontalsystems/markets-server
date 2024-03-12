const { create: createAxios } = require('axios')

const sources = [
  { baseURL: `https://mainnet.infura.io/v3/${process.env.INFURA_1_ID}`, secret: process.env.INFURA_1_SECRET },
]

function rotateSource() {
  currentSourceIndex = (currentSourceIndex + 1) % sources.length
}

function createInfuraAxios() {
  const { baseURL } = sources[currentSourceIndex]
  return createAxios({ baseURL, timeout: 180000 * 3 })
}

function post(data) {
  const source = sources[currentSourceIndex]
  const headers = {
    'Content-Type': 'application/json'
  }

  if (source.secret) {
    headers.Authorization = `Basic ${Buffer.from(`:${source.secret}`).toString('base64')}`
  }

  return infura.post('', data, { headers }).then(res => res.data)
}

let currentSourceIndex = 0
let infura = createInfuraAxios()

exports.proxy = async (req, res) => {
  try {
    res.send(await post(req.body))
  } catch ({ response, message }) {
    if (response && response.status === 429) {
      rotateSource()
      try {
        infura = createInfuraAxios()
        res.send(await post(req.body))
      } catch (err) {
        res.status(500).send('Internal server error')
      }
    } else {
      res.status(response.status || 500).send(message || 'Internal server error')
    }
  }
}
