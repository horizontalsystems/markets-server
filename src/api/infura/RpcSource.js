const { create: createAxios } = require('axios')

class RpcSource {
  constructor(isMainnet) {
    const infuraKeys = (process.env.INFURA_KEYS || '').split(',')
    const drpcKeys = (process.env.DRPC_KEYS || '').split(',')

    this.currentSourceIndex = 0
    this.sources = []

    for (const key of drpcKeys) {
      const mode = isMainnet ? 'mainnet' : 'sepolia'
      this.sources.push({ key, resource: 'drpc', url: `https://${mode}.drpc.org` })
    }

    for (const item of infuraKeys) {
      const [id, key] = item.split(':')
      const mode = isMainnet ? 'eth' : 'sepolia'

      this.sources.push({ key, resource: 'infura', url: `https://${mode}.infura.io/v3/${id}` })
    }

    this.axios = this.createAxios()
  }

  rotateSource() {
    this.currentSourceIndex = (this.currentSourceIndex + 1) % this.sources.length
    this.axios = this.createAxios()
  }

  getCurrentSource() {
    return this.sources[this.currentSourceIndex]
  }

  createAxios() {
    const { url: baseURL } = this.getCurrentSource()
    return createAxios({ baseURL, timeout: 180000 * 3 })
  }

  post(data) {
    const source = this.getCurrentSource()
    const headers = {
      'Content-Type': 'application/json'
    }

    if (source.resource === 'infura') {
      headers.Authorization = `Basic ${Buffer.from(`:${source.key}`).toString('base64')}`
    } else if (source.resource === 'drpc') {
      headers['Drpc-Key'] = source.key
    }

    return this.axios.post('', data, { headers }).then(res => res.data)
  }
}

module.exports = RpcSource
