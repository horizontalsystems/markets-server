const defiyield = require('../providers/defiyield')
const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const ContractIssue = require('../db/models/ContractIssue')
const utils = require('../utils')

class DefiyieldSyncer extends Syncer {
  constructor() {
    super()
    this.chains = ['ethereum', 'binance-smart-chain', 'cronos', 'arbitrum-one']
  }

  async start() {
    this.cron('1d', this.syncLatest)
  }

  async syncHistorical(uids) {
    const platforms = await Platform.query(`
      SELECT
        p.*
      FROM coins c, platforms p
      WHERE c.uid in(:uids)
        AND c.id = p.coin_id
        AND p.chain_uid in (:chains)
        AND p.address is not null
        AND p.decimals is not null
    `, { uids, chains: this.chains })

    await this.sync(platforms)
  }

  async syncLatest() {
    const platforms = await Platform.getByChain(this.chains, true)
    await this.sync(platforms)
  }

  async sync(platforms) {
    const mapNetworkIds = network => {
      switch (network) {
        case 'ethereum':
          return 1
        case 'binance-smart-chain':
          return 56
        case 'cronos':
          return 25
        case 'arbitrum-one':
          return 42161
        default:
          return null
      }
    }

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]
      const networkId = mapNetworkIds(platform.chain_uid)

      if (!networkId) {
        continue
      }

      try {
        const issues = await defiyield.getIssues(platform.address, networkId)
        await this.storeData(issues, platform.id)
        await utils.sleep(500)
      } catch (e) {
        console.log(e.message)
      }
    }
  }

  async storeData(data, platformId) {
    const issues = []
    const coreIssues = data.coreIssues || []
    const generalIssues = data.generalIssues || []

    const mapIssue = (issue) => {
      const item = {}

      if (issue.confidence) {
        item.confidence = issue.confidence
      }

      if (issue.impact) {
        item.impact = issue.impact
      }

      if (issue.description) {
        item.description = issue.description
      }

      return item
    }

    const mapItems = (type, items = []) => {
      for (let i = 0; i < items.length; i += 1) {
        const issue = items[i]
        const item = { issue: type }

        if (issue.title) {
          item.title = issue.title
        }

        if (issue.description) {
          item.description = issue.description
        }

        if (issue.issues && issue.issues.length) {
          item.issues = issue.issues.map(mapIssue)
        }

        issues.push(item)
      }
    }

    mapItems('core', coreIssues)
    mapItems('general', generalIssues)

    if (!issues.length) {
      return
    }

    await ContractIssue.upsert({ platform_id: platformId, issues })
      .then(() => {
        console.log(`Inserted contract issue for ${platformId}`)
      })
      .catch(console.error)
  }

  async getPlatforms(chains) {
    const platforms = await Platform.getByChain(chains, true)
    console.log(platforms.length)
    return []
    const list = []

    platforms.forEach(({ id, chain_uid: chain, address }) => {
      if (address) {
        list.push({ address, chain, id })
      }
    })

    return list
  }

}

module.exports = DefiyieldSyncer
