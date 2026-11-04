const { create: createAxios } = require('axios')

class RpcSource {
  constructor(network) {
    const infuraKeys = (process.env.INFURA_KEYS || '').split(',')
    const drpcKeys = (process.env.DRPC_KEYS || '').split(',')
    const isEthereum = network === 'mainnet' || network === 'sepolia'

    this.currentSourceIndex = 0
    this.sources = []

    // eslint-disable-next-line no-restricted-syntax
    for (const key of drpcKeys) {
      const url = isEthereum
        ? `https://lb.drpc.live/ogrpc?network=${network}`
        : `https://lb.drpc.live/${network}/${key}`

      this.sources.push({ key, resource: 'drpc', url })
    }

    if (isEthereum) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of infuraKeys) {
        const [id, key] = item.split(':')

        this.sources.push({ key, resource: 'infura', url: `https://${network}.infura.io/v3/${id}` })
      }
    }

    if (network === 'tron') {
      const tronGridKeys = (process.env.TRONGRID_KEYS || '').split(',').filter(key => key)

      // eslint-disable-next-line no-restricted-syntax
      for (const key of tronGridKeys) {
        this.sources.push({ key, resource: 'trongrid', url: 'https://api.trongrid.io/jsonrpc' })
      }
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
    } else if (source.resource === 'trongrid') {
      headers['TRON-PRO-API-KEY'] = source.key
    }

    return this.axios.post('', data, { headers }).then(res => res.data)
  }
}

module.exports = RpcSource
