const Web3Solana = require('@solana/web3.js')

class Web3SolanaProvider {
  constructor(url) {
    this.web3 = new Web3Solana.Connection(url)
  }

  getDecimals(address) {
    try {
      const publicKey = new Web3Solana.PublicKey(address)
      return this.web3.getParsedAccountInfo(publicKey)
        .then(({ value }) => this.getParsedInfo(value).decimals)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  getParsedInfo({ data = { parsed: { info: {} } } }) {
    return data.parsed.info
  }
}

module.exports = Web3SolanaProvider
