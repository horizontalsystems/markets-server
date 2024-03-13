const { create: createAxios } = require('axios')

class RpcSource {
  constructor(mode) {
    this.sources = [
      { baseURL: `https://${mode}.infura.io/v3/${process.env.INFURA_1_ID}`, secret: process.env.INFURA_1_SECRET }
    ]
    this.currentSourceIndex = 0
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

    if (source.secret) {
      headers.Authorization = `Basic ${Buffer.from(`:${source.secret}`).toString('base64')}`
    }

    return this.axios.post('', data, { headers }).then(res => res.data)
  }
}

module.exports = RpcSource
