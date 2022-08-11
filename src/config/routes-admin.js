const express = require('express')
const { Op } = require('sequelize')
const { crud } = require('express-crud-router')
const { exec } = require('child_process')
const Coin = require('../db/models/Coin')
const Chain = require('../db/models/Chain')
const Language = require('../db/models/Language')
const Platform = require('../db/models/Platform')
const Category = require('../db/models/Category')
const CoinCategories = require('../db/models/CoinCategories')
const TreasuryEntity = require('../db/models/TreasuryEntity')
const Treasury = require('../db/models/Treasury')
const Fund = require('../db/models/Fund')
const FundsInvested = require('../db/models/FundsInvested')
const Report = require('../db/models/Report')
const AddressLabel = require('../db/models/AddressLabel')
const Exchange = require('../db/models/Exchange')
const EvmMethodLabel = require('../db/models/EvmMethodLabel')
const UpdateState = require('../db/models/UpdateState')

const router = express.Router()

function purgeCache() {
  exec('curl -XPURGE -I https://api-dev.blocksdecoded.com/v1/coins/list', (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
    }
    console.log(`stdout: ${stdout}`)
  })
}

async function search(q, limit, Model, attributes) {
  const filter = []

  switch (Model.name) {
    case 'Platform':
      filter.push({ address: q })
      break
    default:
      filter.push({ uid: q })
  }

  const rows = await Model.findAll({
    where: { [Op.or]: filter },
    attributes,
    limit
  })

  return { rows, count: rows.length }
}

async function getList({ filter, limit, offset, order }, Model, attributes) {
  const count = await Model.count()
  const rows = await Model.findAll({ where: filter, limit, order, offset, attributes })

  return { rows, count }
}

function getOne(id, Model, attributes) {
  return Model.findOne({ attributes, where: { id } })
}

const createUpdateDelete = Model => {
  const updateNew = () => { // will be removed after table rename
    switch (Model.tableName) {
      case 'chains':
        return UpdateState.reset('blockchains')
      case 'platforms':
        return UpdateState.reset('tokens')
      default:
    }
  }

  return {
    create: async data => {
      const record = await Model.create(data)
      await UpdateState.reset(Model.tableName)
      await updateNew()
      await purgeCache()

      return record
    },
    update: async (id, values) => {
      const record = await Model.update(values, { where: { id } }).then(() => values)
      await UpdateState.reset(Model.tableName)
      await updateNew()
      await purgeCache()

      return record
    },
    destroy: async id => {
      const destroy = await Model.destroy({ where: { id } })
      await UpdateState.reset(Model.tableName)
      await updateNew()
      await purgeCache()

      return destroy
    }
  }
}

const opts = (Model, attrs, attrsOne = []) => ({
  search: (q, limit) => search(q, limit, Model, attrs),
  getList: p => getList(p, Model, attrs),
  getOne: id => getOne(id, Model, [...attrs, ...attrsOne]),
  ...createUpdateDelete(Model)
})

router.use(
  crud('/coins', opts(Coin, ['id', 'uid', 'name', 'code'], ['description', 'security', 'links', 'coingecko_id', 'price'])),
  crud('/chains', opts(Chain, ['id', 'uid', 'name', 'url'])),
  crud('/languages', opts(Language, ['id', 'code', 'name'])),
  crud('/platforms', opts(Platform, ['id', 'coin_id', 'chain_uid', 'type', 'symbol', 'address', 'decimals'])),
  crud('/categories', opts(Category, ['id', 'uid', 'name', 'order', 'description', 'enabled'])),
  crud('/coin_categories', opts(CoinCategories, ['id', 'coin_id', 'category_id'])),
  crud('/treasury_entities', opts(TreasuryEntity, ['id', 'uid', 'name', 'country', 'type'])),
  crud('/treasuries', opts(Treasury, ['id', 'coin_id', 'treasury_entity_id', 'amount'])),
  crud('/funds', opts(Fund, ['id', 'name', 'uid', 'website', 'is_individual'])),
  crud('/funds_invested', opts(FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date'])),
  crud('/reports', opts(Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body'])),
  crud('/address_labels', opts(AddressLabel, ['id', 'address', 'label'])),
  crud('/exchanges', opts(Exchange, ['id', 'uid', 'name'])),
  crud('/evm_method_labels', opts(EvmMethodLabel, ['id', 'method_id', 'label'])),
  crud('/update_states', opts(UpdateState, ['id', 'name', 'date']))
)

module.exports = router
