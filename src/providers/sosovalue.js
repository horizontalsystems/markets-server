const createAxios = require('axios').create
const jsonData = require('./sosovalue.json')

const api = createAxios({
  baseURL: 'https://gw.sosovalue.com',
  timeout: 180000,
})

const web = createAxios({
  baseURL: 'https://sosovalue.xyz',
  timeout: 180000,
})

exports.getTotal = function getTotal() {
  return api
    .get('/data/anno/market/quotation/getCryptoTotal')
    .then(({ data }) => {
      return data
    })
}

exports.getEftData = function getEftData() {
  return api
    .post('/finance/etf-info-do/anno/findList', {})
    .then(({ data: resp }) => {
      return resp.data
    })
}

exports.getEftFlow = function getEftFlow() {
  return api
    .post('/data/s-chart-config-do/findByName', {
      innerKey: 'Total_Crypto_Spot_ETF_Fund_Flow',
      langType: 1
    })
    .then(({ data: resp }) => {
      return resp.data
    })
}

exports.findListByIdsOrNames = function findListByIdsOrNames(nameList) {
  return api
    .post('/data/s-indicator-data-do/findListByIdsOrNames', { nameList })
    .then(({ data: resp }) => {
      return resp.data
    })
}

exports.getSpotEtf = function getSpotEtf() {
  return web
    .get('/assets/etf/us-btc-spot')
    .then(res => {
      return res.data
    })
}

exports.getSpotEtfJSON = function getSpotEtf() {
  return jsonData
}
