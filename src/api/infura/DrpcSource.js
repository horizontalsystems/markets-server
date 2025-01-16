const { create: createAxios } = require('axios')

class DRpcSource {
  constructor(mode) {
    const keys = (process.env.DRPC_KEYS || '').split(',')

    this.currentSourceIndex = 0
    this.sources = keys.map(item => {
      const [key] = item.split(':')
      return { baseURL: `https://${mode}.drpc.org`, key }
    })
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
    const { baseURL } = this.getCurrentSource()
    return createAxios({ baseURL, timeout: 180000 * 3 })
  }

  post(data) {
    const source = this.getCurrentSource()
    const headers = {
      'Content-Type': 'application/json'
    }

    if (source.key) {
      headers['Drpc-Key'] = source.key
    }

    return this.axios.post('', data, { headers }).then(res => res.data)
  }
}

module.exports = DRpcSource
