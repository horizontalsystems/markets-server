const express = require('express')
const controller = require('./reports.controller')
const { validateReports } = require('./reports.validator')

const router = express.Router()

/**
 * @api {get} /v1/reports List reports
 * @apiDescription Get a list of reports
 * @apiVersion 1.0.0
 * @apiGroup Report
 *
 * @apiSuccess  {String}    report.author          Report's author
 * @apiSuccess  {String}    report.title           Report's title
 * @apiSuccess  {String}    report.body            Report's body
 * @apiSuccess  {String}    report.date            Report's date
 * @apiSuccess  {String}    report.url             Report's url
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [{
 *    "author": "Citi GPS",
 *    "title": "BITCOIN At the Tipping Point",
 *    "body": "Canadian investment fund manager 3iQ isthe news nvestment fund manager...",
 *    "date": "2021-11-04",
 *    "url": "http://domain.com"
 *  }]
 */
router.get('/', validateReports, controller.index)

module.exports = router
