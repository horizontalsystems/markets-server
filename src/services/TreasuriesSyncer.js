const cheerio = require('cheerio')
const { snakeCase } = require('lodash')

const TreasuryCompany = require('../db/models/TreasuryCompany')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const bTreasuries = require('../providers/bitcointreasuries')

class TreasuriesSyncer extends CoinPriceHistorySyncer {
  async sync() {
    const types = [
      'public-companies',
      'private-companies',
      'etfs-and-exchanges',
      'governments'
    ]

    try {
      for (let i = 0; i < types.length; i += 1) {
        const data = await this.fetchTreasuries({ type: types[i] })
        await this.storeTreasuryCompanies(data)
      }
    } catch (e) {
      console.log('Error syncing treasuries', e.message)
    }
  }

  async fetchTreasuries({ type }) {
    const data = await bTreasuries.getCompanies(type)
    const $ = cheerio.load(data)

    const header = $('h1')
      .filter((i, el) => $(el).text().includes(this.getTittle(type)))

    const section = header.parents('section')
    const items = $(section).find('table > tbody > tr')

    return this.parseTreasuries(items, $, type)
  }

  getTittle(type) {
    switch (type) {
      case 'public-companies':
        return 'Publicly Traded Bitcoin Treasury Companies'
      case 'private-companies':
        return 'Private Companies Holding Bitcoin'
      case 'etfs-and-exchanges':
        return 'Bitcoin ETFs, Exchanges, and Other Custodians'
      case 'governments':
      default:
        return 'Government Entities Holding Bitcoin'
    }
  }

  async storeTreasuryCompanies(values) {
    if (!values.length) {
      return
    }

    const records = values.map(item => {
      return {
        uid: snakeCase(item.name),
        name: item.name,
        code: item.code,
        amount: item.bitcoin,
        country: item.country,
        coin_uid: 'bitocin',
        type: item.type
      }
    })

    console.log(records)

    await TreasuryCompany.bulkCreate(records, {
      updateOnDuplicate: ['name', 'amount', 'country', 'coin_uid', 'is_private'],
      returning: false
    })
      .then((data) => {
        console.log('Inserted treasuries', data.length)
      })
      .catch(err => {
        console.error(err)
      })
  }

  async parseTreasuries(items, $, type) {
    const companies = []
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]

      const child = item.children.filter(c => c.type !== 'comment')
      const childTitle = child[2].children.filter(c => c.type !== 'comment')
      const country = $(child[1]).find('a').prop('href').replace('/countries/', '')

      const code = $(childTitle).find('span').text()
      const name = $(childTitle).find('a').text()
      const bitcoin = $(child[3]).text().replace(/[₿,]/g, '').trim()

      companies.push({ name, code, bitcoin, country, type })
    }

    return companies
  }

}

module.exports = TreasuriesSyncer
