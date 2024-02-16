const defiyield = require('../providers/defiyield')
const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const CoinAudit = require('../db/models/CoinAudit')

class AuditSyncer extends Syncer {

  async start() {
    this.cron('1d', this.syncLatest)
  }

  async syncHistorical() {
    return this.syncLatest()
  }

  async syncLatest() {
    try {
      const platforms = await this.getPlatforms()
      await this.sync(platforms.map)
    } catch (e) {
      console.error(e)
    }
  }

  async sync(platforms, page = 1, limit = 1000) {
    const defiAudits = await defiyield.getAudits(page, limit)
    const coinAudits = {}

    const getCoinId = (networks = []) => {
      for (let i = 0; i < networks.length; i += 1) {
        const network = networks[i]
        const coinId = platforms[network.token_address]
        if (coinId) {
          return coinId
        }
      }
    }

    const mapAudits = items => {
      const audits = []
      for (let i = 0; i < items.length; i += 1) {
        const audit = items[i]
        if (!audit.name || !audit.audit_link) {
          continue
        }

        audits.push({
          name: audit.name,
          tech_issues: audit.tech_issues,
          tech_issues_low: audit.tech_issues_low,
          tech_issues_medium: audit.tech_issues_medium,
          tech_issues_high: audit.tech_issues_high,
          date: audit.date,
          audit_link: audit.audit_link,
          audit_url: audit.audit_url
        })
      }

      return audits
    }

    for (let i = 0; i < defiAudits.length; i += 1) {
      const item = defiAudits[i]
      const coinId = getCoinId(item.auditNetworks)
      if (!coinId || !item.partnerAudits) continue

      const audits = mapAudits(item.partnerAudits)
      if (!audits.length) {
        continue
      }

      const list = coinAudits[coinId] || (coinAudits[coinId] = [])
      list.push(...audits)
    }

    const data = Object.entries(coinAudits).map(([id, values]) => {
      return { coin_id: id, audits: values }
    })

    await this.storeData(data)

    if (defiAudits.length >= limit) {
      return this.sync(platforms, page + 1, limit)
    }
  }

  async storeData(audits) {
    if (!audits.length) {
      return
    }

    await CoinAudit.bulkCreate(audits, { updateOnDuplicate: ['coin_id', 'audits'] })
      .then(() => {
        console.log(`Inserted audits ${audits.length}`)
      })
      .catch(e => console.log(e))
  }

  async getPlatforms() {
    const platforms = await Platform.getByChain(null, true)
    const map = {}

    for (let i = 0; i < platforms.length; i += 1) {
      const { address, coin_id: coinId } = platforms[i]
      map[address] = coinId
    }

    return { map }
  }
}

module.exports = AuditSyncer
