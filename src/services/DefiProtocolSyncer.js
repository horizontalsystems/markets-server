const { sum, groupBy } = require('lodash')
const defillama = require('../providers/defillama')
const Syncer = require('./Syncer')
const DefiProtocol = require('../db/models/DefiProtocol')
const DefiProtocolTvl = require('../db/models/DefiProtocolTvl')
const Coin = require('../db/models/Coin')
const utils = require('../utils')

class DefiProtocolSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical(protocols) {
    if (protocols) {
      return this.syncHistoricalTvls(await DefiProtocol.getIds(protocols))
    }

    if (await DefiProtocolTvl.exists()) {
      return
    }

    if (!await DefiProtocol.exists()) {
      try {
        await this.syncProtocols(await this.fetchProtocols())
      } catch (e) {
        console.error(e)
      }
    }

    await this.syncHistoricalTvls(await DefiProtocol.getIds())
  }

  async syncHistoricalTvls(protocols) {
    await DefiProtocolTvl.delete(protocols.map(p => p.id))

    for (let i = 0; i < protocols.length; i += 1) {
      try {
        await this.syncProtocolTvls(protocols[i])
        await utils.sleep(300)
      } catch (e) {
        console.error(e)
      }
    }
  }

  async syncProtocolTvls(defiProtocol) {
    const protocol = await defillama.getProtocol(defiProtocol.defillama_id)
    const tvls = {}

    for (let i = 0; i < protocol.tvl.length; i += 1) {
      const item = protocol.tvl[i]
      const date = new Date(item.date * 1000).setMinutes(0, 0, 0)

      tvls[date] = {
        date,
        defi_protocol_id: defiProtocol.id,
        tvl: item.totalLiquidityUSD,
        chain_tvls: {}
      }
    }

    Object.entries(protocol.chainTvls).forEach(([chain, data]) => {
      for (let i = 0; i < data.tvl.length; i += 1) {
        const item = data.tvl[i]
        const date = new Date(item.date * 1000).setMinutes(0, 0, 0)
        const tvl = tvls[date]
        if (tvl) {
          tvl.chain_tvls[chain] = item.totalLiquidityUSD
        }
      }
    })

    const records = await DefiProtocolTvl.bulkCreate(Object.values(tvls), { ignoreDuplicates: true })
    console.log(`Inserted ${records.length} tvl record for ${defiProtocol.defillama_id}`)
  }

  async syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats({ dateTo }) {
    try {
      const protocols = await this.fetchProtocols()
      await this.syncProtocols(protocols, dateTo, await this.mapTvlsMap(protocols))
    } catch (e) {
      console.error(e)
    }
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await DefiProtocolTvl.deleteExpired(dateFrom, dateTo)
  }

  async syncProtocols(protocols, dateTo, prevTvlMap = {}) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        coingecko_id: protocols.map(item => item.gecko_id).filter(id => id)
      }
    })

    const protocolsList = []
    const parentProtocols = {}

    for (let i = 0; i < protocols.length; i += 1) {
      const protocol = protocols[i]
      if (!protocol.parentProtocol) {
        protocolsList.push(protocol)
        continue
      }

      const parentProtocol = parentProtocols[protocol.parentProtocol]
      if (parentProtocol) {
        parentProtocol.tvl = sum([protocol.tvl, parentProtocol.tvl])
        parentProtocol.chains = [...new Set([...protocol.chains, ...parentProtocol.chains])]

        if (protocol.gecko_id) {
          parentProtocol.slug = protocol.slug
          parentProtocol.name = protocol.name
        }

        Object.keys(protocol.chainTvls).forEach(key => {
          parentProtocol.chainTvls[key] = sum([
            protocol.chainTvls[key],
            parentProtocol.chainTvls[key]
          ])
        })
      } else {
        parentProtocols[protocol.parentProtocol] = protocol
      }
    }

    const projects = [...protocolsList, ...Object.values(parentProtocols)]
    const ids = utils.reduceMap(coins, 'coingecko_id', 'id')
    const recordIds = []

    for (let i = 0; i < projects.length; i += 1) {
      const protocol = projects[i]
      const coinId = ids[protocol.gecko_id]
      const prevTvl = prevTvlMap[protocol.slug] || {}

      if (protocol.tvl <= 0) {
        continue
      }

      const values = {
        name: protocol.name,
        logo: protocol.logo,
        defillama_id: protocol.slug,
        coingecko_id: protocol.gecko_id,
        tvl: protocol.tvl,
        tvl_change: {
          change_1d: utils.percentageChange(prevTvl['1d'], protocol.tvl),
          change_1w: utils.percentageChange(prevTvl['1w'], protocol.tvl),
          change_2w: utils.percentageChange(prevTvl['2w'], protocol.tvl),
          change_1m: utils.percentageChange(prevTvl['1m'], protocol.tvl),
          change_3m: utils.percentageChange(prevTvl['3m'], protocol.tvl),
          change_6m: utils.percentageChange(prevTvl['6m'], protocol.tvl),
          change_1y: utils.percentageChange(prevTvl['1y'], protocol.tvl)
        },
        chain_tvls: protocol.chainTvls,
        chains: protocol.chains
      }

      if (coinId) {
        values.coin_id = coinId
      }

      const record = await this.upsertProtocol(values)
      await this.upsertProtocolTvl(record, dateTo)
      recordIds.push(record.id)
    }

    await DefiProtocol.clean(recordIds.filter(i => i))
    await DefiProtocol.resetRank()
  }

  async upsertProtocol(values) {
    let record = await DefiProtocol.findOne({ where: { defillama_id: values.defillama_id } })
    if (record) {
      console.log(`Updating DefiProtocol; Defillama: ${values.defillama_id}; Coingecko: ${values.coingecko_id}`)
      await record.update(values)
    } else {
      console.log(`Creating DefiProtocol; Defillama: ${values.defillama_id}; Coingecko: ${values.coingecko_id}`)
      record = await DefiProtocol.create(values, { ignoreDuplicates: true })
    }

    return record
  }

  upsertProtocolTvl(protocol, date) {
    if (!date) {
      return
    }

    const protocolTvl = {
      date,
      tvl: protocol.tvl,
      defi_protocol_id: protocol.id,
      chain_tvls: protocol.chainTvls
    }

    return DefiProtocolTvl.upsert(protocolTvl).catch(e => console.log(e.message))
  }

  async fetchProtocols() {
    let protocols = []
    try {
      protocols = await defillama.getProtocols()
      console.log(`Fetched new protocols ${protocols.length}`)
    } catch (e) {
      console.log(`Error syncing protocols ${e.message}`)
    }

    return protocols
  }

  async mergeProtocols() {
    const protocols = await defillama.getProtocols()
      .then(p => p.filter(i => i.parentProtocol && i.slug))

    const values = Object.values(groupBy(protocols, 'parentProtocol'))

    for (let i = 0; i < values.length; i += 1) {
      let parentProtocol

      const data = values[i]
      const childProtocolSlugs = data.map(p => {
        if (p.gecko_id) {
          parentProtocol = p.gecko_id
        }
        return p.slug
      })

      if (!parentProtocol) {
        continue
      }

      const baseProtocols = await DefiProtocol.findOne({ where: { coingecko_id: parentProtocol } })
      if (baseProtocols) {
        console.log('Merging protocols', parentProtocol, childProtocolSlugs.join(','))
        const childProtocols = await DefiProtocol.getIds(childProtocolSlugs)
        await this.syncHistoricalTvls(childProtocols)
        await DefiProtocolTvl.mergeProtocols(baseProtocols, childProtocols)
      }
    }
  }

  async mapTvlsMap(protocols) {
    const ids = [...new Set(protocols.map(item => item.slug).filter(id => id))]
    const mapped = {}

    const mapBy = (items, key) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]
        const map = mapped[item.defillama_id] || (mapped[item.defillama_id] = {})

        map[key] = item.tvl
      }
    }

    const { utcDate } = utils
    const history1d = await DefiProtocolTvl.getListByDate(utcDate({ days: -1 }), ids, '1 hour')
    const history1w = await DefiProtocolTvl.getListByDate(utcDate({ days: -7 }), ids)
    const history2w = await DefiProtocolTvl.getListByDate(utcDate({ days: -14 }), ids)
    const history1m = await DefiProtocolTvl.getListByDate(utcDate({ days: -30 }), ids)
    const history3m = await DefiProtocolTvl.getListByDate(utcDate({ days: -90 }), ids)
    const history6m = await DefiProtocolTvl.getListByDate(utcDate({ days: -180 }), ids)
    const history1y = await DefiProtocolTvl.getListByDate(utcDate({ days: -365 }), ids)

    mapBy(history1d, '1d')
    mapBy(history1w, '1w')
    mapBy(history2w, '2w')
    mapBy(history1m, '1m')
    mapBy(history3m, '3m')
    mapBy(history6m, '6m')
    mapBy(history1y, '1y')

    return mapped
  }

}

module.exports = DefiProtocolSyncer
