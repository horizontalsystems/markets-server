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

const router = express.Router()
const action = {
  async search(q, limit, Model, attributes) {
    const filter = []
    switch (Model.name) {
      case 'Platform': {
        filter.push({ address: q })
        break
      }
      default: {
        filter.push({ uid: q })
      }
    }

    const rows = await Model.findAll({
      where: {
        [Op.or]: filter
      },
      attributes,
      limit
    })

    return { rows, count: rows.length }
  },

  async getList({ filter, limit, offset, order }, Model, attributes) {
    const count = await Model.count()
    const rows = await Model.findAll({ where: filter, limit, order, offset, attributes })

    return { rows, count }
  },

  getOne(id, Model, attributes) {
    return Model.findOne({ attributes, where: { id } })
  },

  createUpdateDelete: Model => {
    return ({
      create: data => Model.create(data),
      update: (id, values) => Model.update(values, { where: { id } }).then(() => values),
      destroy: id => Model.destroy({ where: { id } })
    })
  }
}

router.use(
  crud('/coins', {
    search: (q, limit) => action.search(q, limit, Coin, ['id', 'uid', 'name', 'code']),
    getList: params => action.getList(params, Coin, ['id', 'uid', 'name', 'code']),
    getOne: id => action.getOne(id, Coin, ['id', 'uid', 'name', 'code', 'description', 'security']),
    ...action.createUpdateDelete(Coin)
  }),

  crud('/languages', {
    search: (q, limit) => action.search(q, limit, Language, ['id', 'code', 'name']),
    getList: params => action.getList(params, Language, ['id', 'code', 'name']),
    getOne: id => action.getOne(id, Language, ['id', 'code', 'name']),
    ...action.createUpdateDelete(Language)
  }),

  crud('/platforms', {
    search: (q, limit) => action.search(q, limit, Platform, ['id', 'coin_id', 'type', 'symbol', 'address', 'decimals']),
    getList: params => action.getList(params, Platform, ['id', 'coin_id', 'type', 'symbol', 'address', 'decimals']),
    getOne: id => action.getOne(id, Platform, ['id', 'coin_id', 'type', 'symbol', 'address', 'decimals']),
    ...action.createUpdateDelete(Platform)
  }),

  crud('/categories', {
    search: (q, limit) => action.search(q, limit, Category, ['id', 'uid', 'name', 'order', 'description', 'enabled']),
    getList: params => action.getList(params, Category, ['id', 'uid', 'name', 'order', 'description', 'enabled']),
    getOne: id => action.getOne(id, Category, ['id', 'uid', 'name', 'order', 'description', 'enabled']),
    ...action.createUpdateDelete(Category)
  }),

  crud('/coin_categories', {
    search: (q, limit) => action.search(q, limit, CoinCategories, ['id', 'coin_id', 'category_id']),
    getList: params => action.getList(params, CoinCategories, ['id', 'coin_id', 'category_id']),
    getOne: id => action.getOne(id, CoinCategories, ['id', 'coin_id', 'category_id']),
    ...action.createUpdateDelete(CoinCategories)
  }),

  crud('/treasury_entities', {
    search: (q, limit) => action.search(q, limit, TreasuryEntity, ['id', 'uid', 'name', 'country', 'type']),
    getList: params => action.getList(params, TreasuryEntity, ['id', 'uid', 'name', 'country', 'type']),
    getOne: id => action.getOne(id, TreasuryEntity, ['id', 'uid', 'name', 'country', 'type']),
    ...action.createUpdateDelete(TreasuryEntity)
  }),

  crud('/treasuries', {
    search: (q, limit) => action.search(q, limit, Treasury, ['id', 'coin_id', 'treasury_entity_id']),
    getList: params => action.getList(params, Treasury, ['id', 'coin_id', 'treasury_entity_id']),
    getOne: id => action.getOne(id, Treasury, ['id', 'coin_id', 'treasury_entity_id']),
    ...action.createUpdateDelete(Treasury)
  }),

  crud('/funds', {
    search: (q, limit) => action.search(q, limit, Fund, ['id', 'name', 'uid', 'website', 'is_individual']),
    getList: params => action.getList(params, Fund, ['id', 'name', 'uid', 'website', 'is_individual']),
    getOne: id => action.getOne(id, Fund, ['id', 'name', 'uid', 'website', 'is_individual']),
    ...action.createUpdateDelete(Fund)
  }),

  crud('/funds_invested', {
    search: (q, limit) => action.search(q, limit, FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date']),
    getList: params => action.getList(params, FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date']),
    getOne: id => action.getOne(id, FundsInvested, ['id', 'coin_id', 'funds', 'amount', 'round', 'date']),
    ...action.createUpdateDelete(FundsInvested)
  }),

  crud('/reports', {
    search: (q, limit) => action.search(q, limit, Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body']),
    getList: params => action.getList(params, Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body']),
    getOne: id => action.getOne(id, Report, ['id', 'coin_id', 'title', 'author', 'url', 'date', 'body']),
    ...action.createUpdateDelete(Report)
  }),
)

module.exports = router
