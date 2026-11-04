const { create: createAxios } = require('axios')

const parseKeys = value => (value || '').split(',').map(it => it.trim()).filter(Boolean)

class RpcSource {
  constructor(network) {
    const infuraKeys = parseKeys(process.env.INFURA_KEYS)
    const drpcKeys = parseKeys(process.env.DRPC_KEYS)
    const isEthereum = network === 'mainnet' || network === 'sepolia'
    // dRPC's slug for ethereum mainnet is `ethereum` — `mainnet` answers 400
    const drpcSlug = network === 'mainnet' ? 'ethereum' : network

    this.currentSourceIndex = 0
    this.sources = []

    // eslint-disable-next-line no-restricted-syntax
    for (const key of drpcKeys) {
      this.sources.push({ key, resource: 'drpc', url: `https://lb.drpc.live/ogrpc?network=${drpcSlug}` })
    }

    if (isEthereum) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of infuraKeys) {
        const [id, key] = item.split(':')

        this.sources.push({ key, resource: 'infura', url: `https://${network}.infura.io/v3/${id}` })
      }
    }

    if (network === 'tron') {
      const tronGridKeys = parseKeys(process.env.TRONGRID_KEYS)

      // eslint-disable-next-line no-restricted-syntax
      for (const key of tronGridKeys) {
        this.sources.push({ key, resource: 'trongrid', url: 'https://api.trongrid.io/jsonrpc' })
      }
    }

    this.axios = this.createAxios()
  }

  rotateSource() {
    if (!this.sources.length) return

    this.currentSourceIndex = (this.currentSourceIndex + 1) % this.sources.length
    this.axios = this.createAxios()
  }

  getCurrentSource() {
    return this.sources[this.currentSourceIndex]
  }

  createAxios() {
    const { url: baseURL } = this.getCurrentSource() || {}
    return createAxios({ baseURL, timeout: 30000 })
  }

  post(data) {
    const source = this.getCurrentSource()

    if (!source) {
      return Promise.reject(new Error('No upstream sources configured'))
    }

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
