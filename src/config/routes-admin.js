const express = require('express')
const { Op } = require('sequelize')
const { crud } = require('express-crud-router')
const Coin = require('../db/models/Coin')
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
const EvmMethodLabel = require('../db/models/EvmMethodLabel')
const UpdateState = require('../db/models/UpdateState')

const router = express.Router()

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

function createUpdateDelete(Model) {
  return {
    create: async data => {
      const record = await Model.create(data)
      await UpdateState.reset(Model.tableName)

      return record
    },
    update: async (id, values) => {
      const record = await Model.update(values, { where: { id } }).then(() => values)
      await UpdateState.reset(Model.tableName)

      return record
    },
    destroy: async id => {
      const destroy = await Model.destroy({ where: { id } })
      await UpdateState.reset(Model.tableName)

      return destroy
    }
  }
}

router.use(
  crud('/coins', {
    search: (q, limit) => search(q, limit, Coin, ['id', 'uid', 'name', 'code']),
    getList: params => getList(params, Coin, ['id', 'uid', 'name', 'code']),
    getOne: id => getOne(id, Coin, ['id', 'uid', 'name', 'code', 'description', 'security', 'links', 'coingecko_id', 'price']),
    ...createUpdateDelete(Coin)
  }),

  crud('/languages', {
    search: (q, limit) => search(q, limit, Language, ['id', 'code', 'name']),
    getList: params => getList(params, Language, ['id', 'code', 'name']),
    getOne: id => getOne(id, Language, ['id', 'code', 'name']),
    ...createUpdateDelete(Language)
  }),

  crud('/platforms', {
    search: (q, limit) => search(q, limit, Platform, ['id', 'coin_id', 'type', 'symbol', 'address', 'decimals']),
    getList: params => getList(params, Platform, ['id', 'coin_id', 'type', 'symbol', 'address', 'decimals']),
    getOne: id => getOne(id, Platform, ['id', 'coin_id', 'type', 'symbol', 'address', 'decimals']),
    ...createUpdateDelete(Platform)
  }),

  crud('/categories', {
    search: (q, limit) => search(q, limit, Category, ['id', 'uid', 'name', 'order', 'description', 'enabled']),
    getList: params => getList(params, Category, ['id', 'uid', 'name', 'order', 'description', 'enabled']),
    getOne: id => getOne(id, Category, ['id', 'uid', 'name', 'order', 'description', 'enabled']),
    ...createUpdateDelete(Category)
  }),

  crud('/coin_categories', {
    search: (q, limit) => search(q, limit, CoinCategories, ['id', 'coin_id', 'category_id']),
    getList: params => getList(params, CoinCategories, ['id', 'coin_id', 'category_id']),
    getOne: id => getOne(id, CoinCategories, ['id', 'coin_id', 'category_id']),
    ...createUpdateDelete(CoinCategories)
  }),

  crud('/treasury_entities', {
    search: (q, limit) => search(q, limit, TreasuryEntity, ['id', 'uid', 'name', 'country', 'type']),
    getList: params => getList(params, TreasuryEntity, ['id', 'uid', 'name', 'country', 'type']),
    getOne: id => getOne(id, TreasuryEntity, ['id', 'uid', 'name', 'country', 'type']),
    ...createUpdateDelete(TreasuryEntity)
  }),

  crud('/treasuries', {
    search: (q, limit) => search(q, limit, Treasury, ['id', 'coin_id', 'treasury_entity_id', 'amount']),
    getList: params => getList(params, Treasury, ['id', 'coin_id', 'treasury_entity_id', 'amount']),
    getOne: id => getOne(id, Treasury, ['id', 'coin_id', 'treasury_entity_id', 'amount']),
    ...createUpdateDelete(Treasury)
  }),

  crud('/funds', {
    search: (q, limit) => search(q, limit, Fund, ['id', 'name', 'uid', 'website', 'is_individual']),
    getList: params => getList(params, Fund, ['id', 'name', 'uid', 'website', 'is_individual']),
    getOne: id => getOne(id, Fund, ['id', 'name', 'uid', 'website', 'is_individual']),
    ...createUpdateDelete(Fund)
  }),

  crud('/funds_invested', {
    search: (q, limit) => search(q, limit, FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date']),
    getList: params => getList(params, FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date']),
    getOne: id => getOne(id, FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date']),
    ...createUpdateDelete(FundsInvested)
  }),

  crud('/reports', {
    search: (q, limit) => search(q, limit, Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body']),
    getList: params => getList(params, Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body']),
    getOne: id => getOne(id, Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body']),
    ...createUpdateDelete(Report)
  }),

  crud('/update_states', {
    search: (q, limit) => search(q, limit, UpdateState, ['id', 'name', 'date']),
    getList: params => getList(params, UpdateState, ['id', 'name', 'date']),
    getOne: id => getOne(id, UpdateState, ['id', 'name', 'date']),
    ...createUpdateDelete(UpdateState)
  }),

  crud('/address_labels', {
    search: (q, limit) => search(q, limit, AddressLabel, ['id', 'address', 'label']),
    getList: params => getList(params, AddressLabel, ['id', 'address', 'label']),
    getOne: id => getOne(id, AddressLabel, ['id', 'address', 'label']),
    ...createUpdateDelete(AddressLabel)
  }),

  crud('/evm_method_labels', {
    search: (q, limit) => search(q, limit, EvmMethodLabel, ['id', 'methodId', 'label']),
    getList: params => getList(params, EvmMethodLabel, ['id', 'methodId', 'label']),
    getOne: id => getOne(id, EvmMethodLabel, ['id', 'methodId', 'label']),
    ...createUpdateDelete(EvmMethodLabel)
  }),
)

module.exports = router
