const { get } = require('lodash')
const { utcStartOfDay, utcDate, sleep } = require('../utils')
const vaultsfyi = require('../providers/vaultsfyi')
const Vault = require('../db/models/Vault')
const Syncer = require('./Syncer')

class VaultsSyncer extends Syncer {
  async start() {
    this.cron('1d', this.syncDaily)
  }

  async syncDaily() {
    await this.sync()
    await this.syncHistory(null, true)
  }

  async sync() {
    const data = await vaultsfyi.getAllVaults(0)
    await this.upsert(data)
  }

  async syncHistory(address, isHourly) {
    const vaults = await Vault.findAll({
      raw: true,
      where: {
        ...(address && { address }),
      }
    })

    const params = {
      fromTimestamp: utcStartOfDay({ days: isHourly ? -7 : -6 * 30 }, true),
      toTimestamp: parseInt(utcDate({}, null, true), 10),
      granularity: isHourly ? '1hour' : '1day'
    }

    for (let i = 0; i < vaults.length; i += 1) {
      const vault = vaults[i];
      console.log(`Syncing vaults for ${vault.address}`)

      const data = await vaultsfyi.getHistory(vault.address, params)

      await (isHourly
        ? this.upsertApyHourly(vault, data)
        : this.upsertApyHistory(vault, data))

      await sleep(1000)
    }
  }

  async upsert(data) {
    const mapChain = (network) => {
      switch (network.chainId) {
        case 1:
          return 'ethereum'
        default:
          return network.name
      }
    }

    const rawValues = data.map(item => {
      let chainName = item.network.name
      if (chainName === 'mainnet') {
        chainName = mapChain(item.network)
      }

      return {
        address: item.address,
        name: item.name,
        apy: {
          '1d': get(item, 'apy[\'1day\'].total'),
          '7d': get(item, 'apy[\'7day\'].total'),
          '30d': get(item, 'apy[\'30day\'].total')
        },
        tvl: item.tvl.usd,
        chain: chainName,
        asset_symbol: item.asset.symbol,
        protocol_name: item.protocol.name,
        protocol_logo: get(item, 'protocol.protocolLogo'),
        holders: get(item, 'holdersData.totalCount'),
        url: item.protocolVaultUrl
      }
    })

    const seen = new Map()
    for (let i = 0; i < rawValues.length; i += 1) {
      const row = rawValues[i]
      seen.set(row.address, row) // latest wins
    }

    const values = Array.from(seen.values())
    await Vault.bulkCreate(values, {
      updateOnDuplicate: ['apy', 'tvl', 'chain', 'asset_symbol', 'protocol_name', 'protocol_logo', 'holders', 'url'],
      returning: false
    })
      .then(() => {
        console.log(`Upserted ${values.length} vaults`)
      }).catch(err => {
        console.error('Upsert failed:', err)
      })
  }

  async upsertApyHistory(vault, data) {
    if (!data || !data.length) return

    try {
      const values = data.reduce((acc, item) => {
        return {
          ...acc,
          [item.timestamp]: item.apy.total
        }
      }, {})

      await Vault.queryUpdate('UPDATE vaults set apy_history = :values WHERE address = :address', {
        values: JSON.stringify(values),
        address: vault.address
      })
      console.log(`Updated vaults historical data ${data.length}`)
    } catch (e) {
      console.log(e)
    }
  }

  async upsertApyHourly(vault, data) {
    if (!data || !data.length) return

    try {
      let lastApy = null
      const values = data.reduce((acc, item) => {
        lastApy = item
        return {
          ...acc,
          [item.timestamp]: item.apy.total
        }
      }, {})

      const history = {
        ...vault.apy_history,
        [lastApy.timestamp]: lastApy.apy.total
      }

      const sql = `
        UPDATE vaults
          set apy_history = :history,
              apy_history_hourly = :values
        WHERE address = :address
      `
      await Vault.queryUpdate(sql, {
        values: JSON.stringify(values),
        history: JSON.stringify(history),
        address: vault.address
      })

      console.log(`Updated vaults historical and hourly data ${data.length}`)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = VaultsSyncer
