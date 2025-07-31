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
      fromTimestamp: utcStartOfDay({ days: -(isHourly ? 14 : 6 * 30) }, true),
      toTimestamp: parseInt(utcDate({}, null, true), 10),
      granularity: isHourly ? '1hour' : '1day'
    }

    for (let i = 0; i < vaults.length; i += 1) {
      const vault = vaults[i];
      console.log(`Syncing vaults for ${vault.address}`)

      try {
        const chain = this.mapChainToNetwork(vault.chain)
        const data = await vaultsfyi.getHistory(vault.address, chain, params)

        await (isHourly
          ? this.upsertHourly(vault, data)
          : this.upsertHistory(vault, data))

        await sleep(1000)
      } catch (e) {
        console.log('Error syncing vaults history', vault.address)
      }
    }
  }

  async upsert(data) {
    const rawValues = data.map(item => {
      let chainName = item.network.name
      if (chainName === 'mainnet') {
        chainName = this.mapChainIdToChain(item.network)
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
        asset_logo: item.asset.assetLogo,
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
      updateOnDuplicate: ['apy', 'tvl', 'chain', 'asset_symbol', 'asset_logo', 'protocol_name', 'protocol_logo', 'holders', 'url'],
      returning: false
    })
      .then(() => {
        console.log(`Upserted ${values.length} vaults`)
      }).catch(err => {
        console.error('Upsert failed:', err)
      })
  }

  async upsertHistory(vault, data) {
    if (!data || !data.length) return

    try {
      const apyHistory = data.reduce((acc, item) => ({
        ...acc,
        [item.timestamp]: item.apy.total
      }), {})

      const tvlHistory = data.reduce((acc, item) => ({
        ...acc,
        [item.timestamp]: item.tvl.usd
      }), {})

      const sql = `
        UPDATE vaults
           set apy_history = :apy_history,
               tvl_history = :tvl_history
         WHERE address = :address
      `
      await Vault.queryUpdate(sql, {
        apy_history: JSON.stringify(apyHistory),
        tvl_history: JSON.stringify(tvlHistory),
        address: vault.address
      })
      console.log(`Updated vaults historical data ${data.length}`)
    } catch (e) {
      console.log(e)
    }
  }

  async upsertHourly(vault, data) {
    if (!data || !data.length) return

    try {
      let lastItem = null

      const apyValues = data.reduce((acc, item) => {
        lastItem = item
        return { ...acc, [item.timestamp]: item.apy.total }
      }, {})

      const tvlValues = data.reduce((acc, item) => {
        return { ...acc, [item.timestamp]: item.tvl.usd }
      }, {})

      const apyHistory = { ...vault.apy_history, [lastItem.timestamp]: lastItem.apy.total }
      const tvlHistory = { ...vault.tvl_history, [lastItem.timestamp]: lastItem.tvl.usd }

      const sql = `
        UPDATE vaults
          set apy_history = :apy_history,
              apy_history_hourly = :apy_values,
              tvl_history = :tvl_history,
              tvl_history_hourly = :tvl_values
        WHERE address = :address
      `
      await Vault.queryUpdate(sql, {
        apy_values: JSON.stringify(apyValues),
        apy_history: JSON.stringify(apyHistory),
        tvl_values: JSON.stringify(tvlValues),
        tvl_history: JSON.stringify(tvlHistory),
        address: vault.address
      })

      console.log(`Updated vaults historical and hourly data ${data.length}`)
    } catch (e) {
      console.log(e)
    }
  }

  mapChainIdToChain(network) {
    switch (network.chainId) {
      case 1:
        return 'ethereum'
      default:
        return network.name
    }
  }

  mapChainToNetwork(chain) {
    switch (chain) {
      case 'ethereum':
        return 'mainnet'
      default:
        return chain
    }
  }
}

module.exports = VaultsSyncer
