const { create: createAxios } = require('axios')

const sources = [
  { url: `/v3/${process.env.INFURA_KEY1}`, baseURL: 'https://mainnet.infura.io' },
]

function rotateSource() {
  currentSourceIndex = (currentSourceIndex + 1) % sources.length
}

function createInfuraAxios() {
  const { baseURL } = sources[currentSourceIndex]
  return createAxios({ baseURL, timeout: 180000 * 3 })
}

let currentSourceIndex = 0
let infura = createInfuraAxios()

exports.proxy = async (req, res) => {
  try {
    const { data } = await infura.post(sources[currentSourceIndex].url, req.body)
    res.send(data)
  } catch ({ response }) {
    if (response && response.status === 429) {
      rotateSource()
      try {
        infura = createInfuraAxios()
        const { data } = await infura.post(sources[currentSourceIndex].url, req.body)
        res.send(data)
      } catch (err) {
        res.status(500).send('Internal server error')
      }
    } else {
      res.status(500).send('Internal server error')
    }
  }
}
